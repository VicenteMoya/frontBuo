import { useState } from 'react';

export default function Login() {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: llamada a /auth/login
        console.log({ user, pass });
    };

    return (
        <div className="login-container">
            <h1>Groupymes</h1>
            <form onSubmit={submit}>
                <input
                    type="text"
                    placeholder="Usuario"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                />
                <button type="submit">Entrar</button>
            </form>
        </div>
    );
}
/*
import React, { useState } from 'react';
import { Button, TextField, Container, Box, Typography, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await axios.post('/api/auth/login', { username: user, password: pass });
            localStorage.setItem('token', resp.data.access_token);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Error de autenticación');
        }
    };

    return (
        <Container maxWidth="xs">
            <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
                <Box display="flex" flexDirection="column" alignItems="center">
                    <Typography component="h1" variant="h5">Groupymes</Typography>
                    <Box component="form" onSubmit={submit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Usuario"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            label="Contraseña"
                            type="password"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                        />
                        <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }}>Entrar</Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}
*/