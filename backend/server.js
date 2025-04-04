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

// --- INÍCIO DA NOVA CONFIGURAÇÃO CORS ---

// 1. Ler a variável de ambiente DIRETAMENTE
const frontendOrigin = process.env.FRONTEND_URL;

// 2. Logar o valor LIDO (ESSENCIAL PARA DIAGNÓSTICO)
console.log(`[CONFIG_CORS] Lendo process.env.FRONTEND_URL: ${frontendOrigin}`);

// 3. Verificar se a variável foi realmente lida
if (!frontendOrigin) {
    console.error("[CONFIG_CORS] ERRO: A variável de ambiente FRONTEND_URL não foi encontrada ou está vazia!");
    // Você pode decidir como lidar aqui: talvez permitir localhost ou lançar um erro.
    // Por enquanto, vamos apenas logar o erro.
}

// 4. Aplicar o middleware CORS usando DIRETAMENTE a variável lida
app.use(cors({
    // Define a origem permitida. Se frontendOrigin for undefined/null/vazio,
    // a origem não será permitida corretamente quando credentials=true.
    origin: frontendOrigin,
    credentials: true, // MUITO IMPORTANTE para sessões/cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Ser explícito sobre métodos
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'] // Ser explícito sobre headers
}));

// 5. Log após aplicar o middleware (para confirmar que esta parte do código rodou)
console.log("[CONFIG_CORS] Middleware CORS aplicado.");

// --- FIM DA NOVA CONFIGURAÇÃO CORS ---

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