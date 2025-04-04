import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './src/config/db.js';
import userRoutes from './src/routes/userRoutes.js';
import ongRoutes from './src/routes/ongRoutes.js';
import { errorHandler, notFound } from './src/middleware/errorMiddleware.js';

dotenv.config();

const app = express();

// Configuração do CORS mais explícita
const allowedOrigins = [
    process.env.FRONTEND_URL, // Sua URL de produção principal
    'http://localhost:5173'   // URL de desenvolvimento local (se ainda usar)
].filter(Boolean); // filter(Boolean) remove entradas undefined/null se FRONTEND_URL não estiver definida

console.log("Origens CORS permitidas:", allowedOrigins); // Log para debug no deploy

app.use(cors({
    origin: function (origin, callback) {
        // Permite requisições sem 'origin' (como Postman ou mobile apps talvez) OU se a origem está na lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.error(`CORS bloqueado para origem: ${origin}`); // Log útil
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Essencial para cookies/sessões
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PgStore = connectPgSimple(session);
const sessionStore = new PgStore({
    pool: pool,
    tableName: 'user_sessions'
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'fallbackSecret_change_this!',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
}));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

app.use('/api/users', userRoutes);
app.use('/api/ongs', ongRoutes);

app.get('/', (req, res) => {
    res.send('API Bicho Solto está rodando...');
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT} em modo ${process.env.NODE_ENV || 'development'}`)); 