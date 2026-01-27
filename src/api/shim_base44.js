import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

// Map entity names to table names
const entityMap = {
    Paciente: 'pacientes',
    Agendamento: 'agendamentos',
    Profissional: 'profissionais',
    User: 'users',
    Contrato: 'contratos',
    ContratoModelo: 'contratos_modelo',
    ContratoPacote: 'contratos_pacote',
    PacoteServico: 'pacotes_servico',
    EstoqueItem: 'estoque_itens',
    Financeiro: 'financeiro',
    Pagamento: 'pagamentos',
    Recebimento: 'recebimentos',
    NotaFiscal: 'notas_fiscais',
    Atividade: 'atividades',
    Anamnese: 'anamneses',
    Evolucao: 'evolucoes',
    Prontuario: 'prontuarios',
    RelatorioGerado: 'relatorios_gerados',
};

const getTable = (entityName) => {
    return entityMap[entityName] || entityName.toLowerCase() + 's';
};

const sanitizePayload = (data) => {
    const sanitized = { ...data };
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === '') {
            sanitized[key] = null;
        }
    });
    return sanitized;
};

const createEntityProxy = (entityName) => {
    const table = getTable(entityName);

    return {
        list: async (sortStr) => {
            let query = supabase.from(table).select('*');
            if (sortStr) {
                const desc = sortStr.startsWith('-');
                const col = desc ? sortStr.substring(1) : sortStr;
                query = query.order(col, { ascending: !desc });
            }
            const { data, error } = await query;
            if (error) {
                console.error(`Error listing ${entityName}:`, error);
                return [];
            }
            return data || [];
        },
        get: async (id) => {
            const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
            if (error) throw error;
            return data;
        },


        create: async (data) => {
            // Remove 'id' if empty so DB generates it
            const { id, ...rest } = data;
            let payload = id ? data : rest;

            // Sanitize payload to convert "" to null (fixes UUID errors)
            payload = sanitizePayload(payload);

            console.log(`[Shim] Creating ${entityName} with payload:`, payload);

            const { data: created, error } = await supabase.from(table).insert(payload).select().single();
            if (error) {
                console.error(`[Shim] Error creating ${entityName}:`, error);
                throw error;
            }
            return created;
        },
        update: async (id, data) => {
            let payload = sanitizePayload(data);
            console.log(`[Shim] Updating ${entityName} ${id} with payload:`, payload);

            const { data: updated, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
            if (error) {
                console.error(`[Shim] Error updating ${entityName}:`, error);
                throw error;
            }
            return updated;
        },
        delete: async (id) => {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
            return { success: true };
        },
        filter: async (criteria) => {
            // Handle simple equality filters
            let query = supabase.from(table).select('*');
            Object.entries(criteria).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
            const { data, error } = await query;
            if (error) {
                console.error(`Error filtering ${entityName}:`, error);
                return [];
            }
            return data || [];
        }
    };
};

export const base44 = {
    auth: {
        me: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                // If no user logic for validation?
                // Return a mock user or throw error
                // throw new Error('Not authenticated');
                return null;
            }
            // Fetch profile from 'users' table
            const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
            return { ...user, ...profile };
        },
        logout: async () => {
            await supabase.auth.signOut();
            window.location.reload();
        },
        redirectToLogin: () => {
            console.log("Redirect to login requested");
            // You might want to implement a real redirect here
        },
        // Add missing auth methods if any
        login: async (email, password) => {
            return supabase.auth.signInWithPassword({ email, password });
        },
        signUp: async (email, password, userData) => {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;

            // Try inserting into users table (might fail if trigger already did it, so ignore error)
            if (data.user && userData) {
                try {
                    await supabase.from('users').insert({
                        id: data.user.id,
                        email,
                        ...userData
                    });
                } catch (e) {
                    // Ignore duplicate key error likely caused by trigger
                    console.log("[Shim] Insert user skipped (probably handled by trigger):", e.message);
                }
            }
            return { data, error: null }; // Correctly return object with data property
        },
        adminCreateUser: async (email, password, userData) => {
            // Create a temporary client to avoid affecting the current session
            const tempClient = createClient(import.meta.env.VITE_PUBLIC_SUPABASE_URL, import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    storage: {
                        getItem: () => null,
                        setItem: () => { },
                        removeItem: () => { },
                    }
                }
            });

            const { data, error } = await tempClient.auth.signUp({
                email,
                password,
                options: {
                    data: userData
                }
            });

            if (error) throw error;

            // Upsert into users table using the MAIN client
            // We use upsert to handle cases where a trigger might have already created the user row
            if (data.user && userData) {
                try {
                    const { error: upsertError } = await supabase.from('users').upsert({
                        id: data.user.id,
                        email,
                        ...userData
                    });

                    if (upsertError) {
                        console.error("[Shim] Error upserting user profile:", upsertError);
                        throw upsertError;
                    }
                } catch (e) {
                    console.error("[Shim] Upsert failed:", e.message);
                    // If profile creation fails, we might want to alert the user, 
                    // though the Auth user was created.
                    throw e;
                }
            }
            return { data, error: null };
        },
        adminUpdateUser: async (userId, password, userData) => {
            // Update profile data in public.users
            if (userData) {
                const { error } = await supabase.from('users').update(userData).eq('id', userId);
                if (error) throw error;
            }

            // Update password if provided
            if (password) {
                // Try using admin API if available (Service Role) - likely fails in pure client
                // Fallback: This usually requires an Edge Function or Service Role Key
                // For now, we attempt it, but catch error.
                try {
                    const tempClient = createClient(import.meta.env.VITE_PUBLIC_SUPABASE_URL, import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY, {
                        auth: {
                            persistSession: false,
                            autoRefreshToken: false,
                            detectSessionInUrl: false,
                            storage: {
                                getItem: () => null,
                                setItem: () => { },
                                removeItem: () => { },
                            }
                        }
                    });
                    const { error } = await tempClient.auth.admin.updateUserById(userId, { password });
                    if (error) throw error;
                } catch (err) {
                    console.error("Admin password update failed (requires Service Role):", err);
                    throw new Error("Não é possível alterar senha de outro usuário sem chave de serviço/backend. (401)");
                }
            }
            return { success: true };
        },
        updatePassword: async (newPassword) => {
            const { data, error } = await supabase.auth.updateUser({
                password: newPassword,
                data: { must_change_password: false } // Reset flag on success
            });
            if (error) throw error;

            // Also update our users table mirror
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('users').update({ must_change_password: false }).eq('id', user.id);
            }

            return { data, error: null };
        },
        resetPasswordForEmail: async (email) => {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password', // or just current URL
            });
            if (error) throw error;
            return { data, error: null };
        }
    },
    appLogs: {
        logUserInApp: async (pageName) => {
            // console.log(`[Shim] Logged user navigation to: ${pageName}`);
            return Promise.resolve();
        }
    },
    entities: new Proxy({}, {
        get: (target, prop) => {
            if (prop === 'Query') return {};
            return createEntityProxy(prop);
        }
    }),
    integrations: {
        Core: {
            UploadFile: async ({ file }) => {
                const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage.from('uploads').upload(fileName, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
                return { file_url: publicUrl };
            },
            InvokeLLM: async ({ prompt }) => {
                const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
                if (!apiKey) {
                    throw new Error('Google API Key não configurada (VITE_GOOGLE_API_KEY)');
                }

                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: prompt
                                }]
                            }]
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error?.message || 'Erro ao chamar Gemini API');
                    }

                    const data = await response.json();
                    return data.candidates[0].content.parts[0].text;
                } catch (error) {
                    console.error("Erro no InvokeLLM:", error);
                    throw error;
                }
            }
        }
    }
};
