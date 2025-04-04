import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Definição de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
// Ajustar o path.dirname para apontar para a raiz do backend
const __dirname = path.dirname(path.dirname(__filename)); // middleware -> src -> backend


// Definir o diretório de destino para os uploads
const uploadDir = path.join(__dirname, 'uploads', 'profiles');

// Garantir que o diretório de uploads exista
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Diretório criado: ${uploadDir}`);
} else {
     console.log(`Diretório de uploads já existe: ${uploadDir}`);
}


// Configuração de armazenamento do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Salva diretamente no diretório final
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Criar um nome de arquivo único para evitar conflitos
    // Usar o ID do usuário (disponível via req.user do middleware 'protect') e um timestamp
    const userId = req.user ? req.user.id : 'unknown'; // Fallback caso protect não rode antes (não deveria acontecer em /me)
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = `${userId}-${uniqueSuffix}${path.extname(file.originalname)}`;
    cb(null, filename);
  }
});

// Filtro de arquivos para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Erro: Apenas arquivos de imagem (jpeg, jpg, png) são permitidos!'), false);
};

// Configuração do Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB
  fileFilter: fileFilter
});

export default upload; 