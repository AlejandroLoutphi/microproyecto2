import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth, Footer } from "./App";
import './Login.css';
import { Register } from "./Register";
import { MainPage } from "./MainPage";

export function Login({ setPage, addNotification, googleSignIn }) {
    useEffect(() => void window.history.pushState(null, "", "login"), []);
    const [formEmail, setFormEmail] = useState('');
    const [formPassword, setFormPassword] = useState('');

    async function loginAccount(e) {
        e.preventDefault();
        signInWithEmailAndPassword(firebaseAuth, formEmail, formPassword)
            .catch((e) => {
                switch (e.code) {
                    case 'auth/invalid-credential':
                        addNotification('Error: el email o contraseña son incorrectos');
                        return;
                    case 'auth/too-many-requests':
                        addNotification('Error: solicitud bloqueada');
                        return;
                    case 'auth/network-request-failed':
                        addNotification('Error al comunicarse con el servidor');
                        return;
                    case 'auth/quota-exceeded':
                        addNotification('Error al comunicarse con el servidor');
                        return;
                    default:
                        addNotification('Error genérico');
                        return;
                }
            });
    }

    return (
        <div className="body_login">
            <div className="login_big_container">
                <div className="login_content">
                    <a className="login_back" onClick={() => setPage(() => MainPage)}>Atrás</a>
                    <h1 className="login_title">¡Bienvenido de nuevo!</h1>
                    <form onSubmit={loginAccount} className="login_form">
                        <h2 className="login_subtitle">Inicio de Sesión</h2>
                        <div className="login_form_section">
                            <label htmlFor="login_email" className="login_form_text">Correo Electrónico</label>
                            <input
                                type="email"
                                id="login_email"
                                name="login_email"
                                value={formEmail}
                                onChange={(e) => setFormEmail(e.target.value)}
                                required
                                minLength="3"
                                maxLength="40"
                            />
                        </div>
                        <div className="login_form_section">
                            <label htmlFor="login_password" className="login_form_text">Contraseña</label>
                            <input
                                type="password"
                                id="login_password"
                                name="login_password"
                                value={formPassword}
                                onChange={(e) => setFormPassword(e.target.value)}
                                required
                                minLength="6"
                                maxLength="40"
                            />
                        </div>
                        <button type="submit" className="button_1">Iniciar Sesión</button>
                    </form>
                    <div className="login_divider">
                        <span className="divider_text">o continúa con</span>
                    </div>
                    <div className="login_divisor">
                        <button type="button" className="login_google_button" onClick={googleSignIn}>
                            <img src="google.png" alt="Google Logo" className="google_logo" />
                            Inicia Sesión con Google
                        </button>
                    </div>
                    <div className="login_to_register">
                        ¿No tienes cuenta? <a onClick={() => setPage(() => Register)}>Regístrate</a>
                    </div>
                </div>
                <div className="login_img"></div>
            </div>
            <Footer />
        </div>
    );
}
