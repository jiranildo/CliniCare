import React from "react";
import { Search, Grid3x3, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ViewHeader({
    searchTerm,
    onSearchChange,
    placeholder = "Buscar...",
    viewMode,
    onViewModeChange,
    children
}) {
    return (
        <Card className="border-none shadow-lg">
            <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <Input
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Tabs value={viewMode} onValueChange={onViewModeChange}>
                        <TabsList className="bg-slate-100">
                            <TabsTrigger value="cards" className="gap-2">
                                <Grid3x3 className="w-4 h-4" />
                                Cards
                            </TabsTrigger>
                            <TabsTrigger value="lista" className="gap-2">
                                <List className="w-4 h-4" />
                                Lista
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                {children && <div className="mt-4">{children}</div>}
            </CardContent>
        </Card>
    );
}
