import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const navigate = useNavigate();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await axios.post('/api/auth/login', {
                username: user,
                password: pass,
            });
            localStorage.setItem('token', resp.data.access_token);
            navigate('/');
        } catch (err) {
            console.error(err);
            alert('Error de autenticación');
        }
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
