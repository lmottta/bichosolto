import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// ... outros imports ...

// Função para login de usuário
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
    }

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas' });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password_hash); // Assumindo que a coluna é password_hash

        if (isMatch) {
            // Senha correta - Armazenar ID na sessão
            req.session.userId = user.id;

             // Construir a URL da imagem de perfil para enviar na resposta
             let profileImageUrl = null;
             if (user.profile_image_path) {
                 const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
                 profileImageUrl = `${apiBaseUrl}${user.profile_image_path}`;
             }


            // Enviar dados do usuário na resposta (sem a senha)
            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                address: user.address,
                city: user.city,
                state: user.state,
                bio: user.bio,
                profileImageUrl: profileImageUrl, // Enviar a URL completa
                createdAt: user.created_at,
                 // Adicione outros campos conforme necessário
            });
        } else {
            res.status(401).json({ message: 'Credenciais inválidas' });
        }
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
    }
};

// Função para buscar o perfil do usuário logado
const getUserProfile = async (req, res) => {
    // O middleware 'protect' já buscou e anexou o usuário a req.user
    // Apenas retornamos os dados (sem a senha)
    // A profileImageUrl já foi construída no middleware protect
    const { password_hash, ...userProfile } = req.user; // Remover hash da senha
    res.json(userProfile);
};


// Helper para garantir que o diretório exista
const ensureDirectoryExistence = async (filePath) => {
    const dirname = path.dirname(filePath);
    try {
        await fs.access(dirname);
    } catch (e) {
        if (e.code === 'ENOENT') {
            await fs.mkdir(dirname, { recursive: true });
        } else {
            throw e;
        }
    }
};


// Função para atualizar o perfil do usuário
const updateUserProfile = async (req, res) => {
    // O middleware protect garante que temos req.user e req.user.id
    const userId = req.user.id;
    const { name, phone, address, city, state, bio } = req.body;

    // Log para verificar dados recebidos (texto)
    console.log('Dados recebidos para atualização (texto):', { name, phone, address, city, state, bio });
    // Log para verificar se um arquivo foi enviado
    console.log('Arquivo recebido:', req.file);


    let profileImagePath = req.user.profile_image_path; // Manter o caminho antigo por padrão
    let oldImagePath = null; // Caminho da imagem antiga para deletar, se houver nova

    // Verificar se uma nova imagem foi enviada (usando req.file de multer)
    if (req.file) {
         // Defina o diretório de uploads relativo à raiz do backend
         const __filename = fileURLToPath(import.meta.url);
         const __dirname = path.dirname(path.dirname(path.dirname(__filename))); // Navega 3 níveis acima (controllers -> src -> backend)
         const uploadsDir = path.join(__dirname, 'uploads', 'profiles');
         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
         const newFilename = `${userId}-${uniqueSuffix}${path.extname(req.file.originalname)}`;
         const newFilePath = path.join(uploadsDir, newFilename);

         // Salvar o caminho relativo para o banco de dados
         profileImagePath = `/uploads/profiles/${newFilename}`;

        try {
            await ensureDirectoryExistence(newFilePath);
            // Mover o arquivo temporário para o destino final (se multer não o fez)
            // Se multer já salva no destino, esta linha pode não ser necessária ou precisar de ajuste
            // await fs.rename(req.file.path, newFilePath); // Verifique a config do multer

            // Se multer salva diretamente, apenas precisamos do caminho relativo
             console.log('Nova imagem salva em:', newFilePath);
             console.log('Caminho relativo para o banco:', profileImagePath);


            // Marcar a imagem antiga para exclusão APÓS salvar a nova no banco
            if (req.user.profile_image_path && req.user.profile_image_path !== profileImagePath) {
                oldImagePath = path.join(__dirname, req.user.profile_image_path); // Caminho completo da imagem antiga
            }

        } catch (error) {
            console.error('Erro ao processar upload de imagem:', error);
            // Considerar não falhar a requisição inteira, apenas logar o erro de imagem
            // return res.status(500).json({ message: 'Erro ao salvar imagem de perfil' });
        }
    }


    try {
        // Atualizar dados no banco
        const updateQuery = `
            UPDATE users
            SET name = $1, phone = $2, address = $3, city = $4, state = $5, bio = $6, profile_image_path = $7
            WHERE id = $8
            RETURNING id, name, email, role, phone, address, city, state, bio, profile_image_path, created_at
        `;
        const values = [
            name || req.user.name, // Usar valor existente se não fornecido
            phone || req.user.phone,
            address || req.user.address,
            city || req.user.city,
            state || req.user.state,
            bio || req.user.bio,
            profileImagePath, // Novo ou antigo caminho da imagem
            userId
        ];

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado para atualização' });
        }

         // Deletar a imagem antiga se uma nova foi salva com sucesso no banco
         if (oldImagePath) {
            try {
                await fs.unlink(oldImagePath);
                console.log('Imagem de perfil antiga deletada:', oldImagePath);
            } catch (deleteError) {
                // Logar erro mas não falhar a requisição principal
                console.error('Erro ao deletar imagem de perfil antiga:', deleteError);
            }
        }


        const updatedUser = result.rows[0];

        // Construir a URL completa da imagem de perfil atualizada
        let updatedProfileImageUrl = null;
        if (updatedUser.profile_image_path) {
            const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
            updatedProfileImageUrl = `${apiBaseUrl}${updatedUser.profile_image_path}`;
        }

        // Atualizar a sessão com os novos dados (opcional, mas bom para consistência imediata)
        req.session.user = {
            ...req.session.user, // Manter outros dados da sessão se houver
            name: updatedUser.name,
            email: updatedUser.email, // Email não muda, mas incluir para completude
            role: updatedUser.role,
            profileImageUrl: updatedProfileImageUrl
        };


        // Retornar os dados atualizados
        res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            phone: updatedUser.phone,
            address: updatedUser.address,
            city: updatedUser.city,
            state: updatedUser.state,
            bio: updatedUser.bio,
            profileImageUrl: updatedProfileImageUrl, // Retorna a URL completa
            createdAt: updatedUser.created_at,
        });

    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar perfil' });
    }
};


// Função para atualizar a senha
const updateUserPassword = async (req, res) => {
    // O middleware protect garante que temos req.user e req.user.id
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Senha atual e nova senha são obrigatórias' });
    }

     if (newPassword.length < 6) {
        return res.status(400).json({ message: 'A nova senha deve ter pelo menos 6 caracteres' });
    }


    try {
         // Buscar hash da senha atual no banco
         const passResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
         if (passResult.rows.length === 0) {
             return res.status(404).json({ message: 'Usuário não encontrado' });
         }
         const currentPasswordHash = passResult.rows[0].password_hash;


        // Verificar se a senha atual fornecida corresponde à senha no banco
        const isMatch = await bcrypt.compare(currentPassword, currentPasswordHash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Senha atual incorreta' });
        }

        // Gerar hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Atualizar a senha no banco
        await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newPasswordHash, userId]);

        res.json({ message: 'Senha atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar senha:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar senha' });
    }
};

// Função para logout de usuário
const logoutUser = (req, res) => {
    // Destruir a sessão
    req.session.destroy((err) => {
        if (err) {
            console.error('Erro ao destruir sessão:', err);
            // Mesmo com erro, tentar limpar o cookie do lado do cliente
            res.clearCookie('connect.sid'); // 'connect.sid' é o nome padrão do cookie de sessão
            return res.status(500).json({ message: 'Erro ao fazer logout' });
        } else {
            // Limpar o cookie do lado do cliente
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'Logout realizado com sucesso' });
        }
    });
};

// ... outras funções do controller ...

export {
    registerUser, // Supondo que existe
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    logoutUser,
    // ... exportar outras funções ...
};

// Nota: A função registerUser também precisaria ser ajustada para
// - Hashear a senha antes de salvar
// - Potencialmente logar o usuário automaticamente após o registro (criando a sessão) 