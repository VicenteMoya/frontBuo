// src/pages/Procesos.tsx
import React, { useEffect, useState } from "react";
import {
    Paper,
    Typography,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Box,
} from "@mui/material";
import api from "../api/axios";

interface ProcessProduct {
    sku: string;
    name: string;
    unit: string | null;
    stock: number;
}

// 🔹 Aquí defines los grupos y los SKUs que pertenecen a cada uno
const PROCESS_GROUPS: { label: string; skus: string[] }[] = [
    {
        label: "Patatas",
        skus: ["CO43", "CP5", "CP23", "CO34", "CO89"],
    },
    {
        label: "Pollo",
        skus: ["PLLOFR","CP17","CO103","C27","C26","C2","C1","C10","C11","C12"],
    },
    {
        label: "Sepia",
        skus: ["PE10"],
    },
];

const ProcesosPage: React.FC = () => {
    const [rows, setRows] = useState<ProcessProduct[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api
            .get<ProcessProduct[]>("/processes/products")
            .then((res) => setRows(res.data))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Cargando procesos...</div>;

    // 🔹 Preparamos los productos por grupo
    const groupsWithProducts = PROCESS_GROUPS.map((group) => ({
        label: group.label,
        products: rows.filter((p) => group.skus.includes(p.sku)),
    }));

    // 🔹 Cualquier producto que no esté en ningún grupo va a "Otros"
    const groupedSkus = new Set(PROCESS_GROUPS.flatMap((g) => g.skus));
    const others = rows.filter((p) => !groupedSkus.has(p.sku));

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Procesos
            </Typography>
            <Typography variant="body2" paragraph>
                Productos que intervienen en procesos (patatas → cortadas, cocidas, etc.) y su stock actual.
            </Typography>

            {groupsWithProducts.map(
                (group) =>
                    group.products.length > 0 && (
                        <Paper key={group.label} sx={{ p: 2, mb: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                {group.label}
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>SKU</TableCell>
                                        <TableCell>Producto</TableCell>
                                        <TableCell>Unidad</TableCell>
                                        <TableCell align="right">Stock</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {group.products.map((p) => (
                                        <TableRow key={p.sku}>
                                            <TableCell>{p.sku}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>{p.unit || "-"}</TableCell>
                                            <TableCell align="right">{p.stock}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Paper>
                    )
            )}

            {others.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Otros productos de proceso
                    </Typography>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>SKU</TableCell>
                                <TableCell>Producto</TableCell>
                                <TableCell>Unidad</TableCell>
                                <TableCell align="right">Stock</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {others.map((p) => (
                                <TableRow key={p.sku}>
                                    <TableCell>{p.sku}</TableCell>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>{p.unit || "-"}</TableCell>
                                    <TableCell align="right">{p.stock}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Paper>
            )}
        </Box>
    );
};

export default ProcesosPage;
