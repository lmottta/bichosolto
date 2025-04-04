import pool from '../config/db.js'; // Ajuste o caminho se necessário

const protect = async (req, res, next) => {
    // Verifica se existe uma sessão e um userId nela
    if (req.session && req.session.userId) {
        try {
            // Busca o usuário no banco de dados usando o ID da sessão
            // Selecione apenas os campos necessários, evite selecionar a senha
            const userResult = await pool.query(
                'SELECT id, name, email, role, phone, address, city, state, bio, profile_image_path FROM users WHERE id = $1',
                [req.session.userId]
            );

            if (userResult.rows.length > 0) {
                // Anexa os dados do usuário ao objeto req
                req.user = userResult.rows[0];

                // Construir a URL completa da imagem de perfil, se existir
                if (req.user.profile_image_path) {
                    const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 5001}`;
                    req.user.profileImageUrl = `${apiBaseUrl}${req.user.profile_image_path}`;
                } else {
                     req.user.profileImageUrl = null;
                }

                next(); // Passa para o próximo middleware ou rota
            } else {
                // Usuário não encontrado no banco, mas tinha ID na sessão (estranho, talvez deletado?)
                req.session.destroy(); // Limpa a sessão inválida
                res.status(401).json({ message: 'Não autorizado, usuário não encontrado.' });
            }
        } catch (error) {
            console.error('Erro no middleware de proteção:', error);
            res.status(401).json({ message: 'Não autorizado, erro ao verificar usuário.' });
        }
    } else {
        // Nenhuma sessão ou userId na sessão
        res.status(401).json({ message: 'Não autorizado, faça login para acessar.' });
    }
};

export { protect }; 