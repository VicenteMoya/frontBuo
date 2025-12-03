import React, { useEffect, useState } from "react";
import {
    Paper,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from "@mui/material";
import api from "../api/axios";

interface ProcessProduct {
    sku: string;
    name: string;
    unit: string | null;
    stock: number;
}

interface ProcessGroupDef {
    id: string;
    title: string;
    mainSku: string;
    skus: string[];
}

/**
 * AQUÍ defines tus bloques de procesos.
 * Cambia / añade SKUs a tu gusto.
 */
const GROUPS: ProcessGroupDef[] = [
    {
        id: "PATATAS",
        title: "Patatas",
        mainSku: "CO43", // PATATA base
        skus: ["CO43", "CP5", "CP23", "CO34", "CO89"], // patata, brava, panadera, prefrita...
    },
    {
        id: "POLLO",
        title: "Pollo",
        mainSku: "PLLOFR", // Pollo fresco
        skus: ["PLLOFR", "CP17","CO103","C27","C26","C2","C1","C10","C11","C12"],
    },
    {
        id: "SEPIA",
        title: "Sepia",
        mainSku: "PE10", // Pollo fresco
        skus: ["PE10"],
    },
];

export default function ProcesosPage() {
    const [dataBySku, setDataBySku] = useState<Record<string, ProcessProduct>>({});

    useEffect(() => {
        api.get<ProcessProduct[]>("/processes/products").then((res) => {
            const map: Record<string, ProcessProduct> = {};
            for (const p of res.data) {
                map[p.sku] = p;
            }
            setDataBySku(map);
        });
    }, []);

    return (
        <div>
            <Typography variant="h5" gutterBottom>
                Procesos
            </Typography>

            {GROUPS.map((group) => {
                // construimos la lista de productos del grupo
                const items: ProcessProduct[] = group.skus
                    .map((sku) => dataBySku[sku])
                    .filter(Boolean) as ProcessProduct[];

                if (items.length === 0) return null;

                // orden: principal primero, resto como vengan en el array
                const mainSku = group.mainSku;
                const ordered = [...items].sort((a, b) => {
                    if (a.sku === mainSku) return -1;
                    if (b.sku === mainSku) return 1;
                    return group.skus.indexOf(a.sku) - group.skus.indexOf(b.sku);
                });

                return (
                    <Paper key={group.id} sx={{ p: 2, mb: 4 }} elevation={3}>
                        {/* Título del bloque */}
                        <Typography
                            variant="h6"
                            sx={{
                                mb: 2,
                                fontWeight: "bold",
                                backgroundColor: "#f5f5f5",
                                p: 1.5,
                                borderLeft: "6px solid #4caf50",
                            }}
                        >
                            {group.title}
                        </Typography>

                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        <b>SKU</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Producto</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Unidad</b>
                                    </TableCell>
                                    <TableCell>
                                        <b>Stock</b>
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ordered.map((p) => {
                                    const isMain = p.sku === mainSku;
                                    return (
                                        <TableRow
                                            key={p.sku}
                                            sx={{
                                                backgroundColor: isMain
                                                    ? "rgba(76, 175, 80, 0.15)" // verde suave
                                                    : "inherit",
                                                fontWeight: isMain ? "bold" : "normal",
                                            }}
                                        >
                                            <TableCell>{p.sku}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>{p.unit || "-"}</TableCell>
                                            <TableCell>{p.stock}</TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </Paper>
                );
            })}
        </div>
    );
}
