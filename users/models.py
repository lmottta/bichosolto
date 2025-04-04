from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import os
import uuid


def profile_image_path(instance, filename):
    """Define o caminho de upload para imagens de perfil."""
    # Obter a extensão do arquivo original
    ext = filename.split('.')[-1]
    # Gerar um novo nome de arquivo com timestamp
    filename = f"{uuid.uuid4().hex}_{int(timezone.now().timestamp())}.{ext}"
    # Retornar o caminho completo
    return os.path.join('profiles', filename)


class User(AbstractUser):
    """Modelo de usuário personalizado."""
    
    ROLE_CHOICES = (
        ('individual', 'Indivíduo'),
        ('ong', 'ONG'),
        ('admin', 'Administrador'),
    )
    
    email = models.EmailField(_('endereço de email'), unique=True)
    role = models.CharField(_('tipo de usuário'), max_length=20, choices=ROLE_CHOICES, default='individual')
    
    # Adicionando related_name para evitar conflitos
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name='custom_user_set',
        related_query_name='user',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name='custom_user_set',
        related_query_name='user',
    )
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('usuário')
        verbose_name_plural = _('usuários')
    
    def __str__(self):
        return self.email


class Profile(models.Model):
    """Perfil de usuário com informações adicionais."""
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    bio = models.TextField(_('biografia'), blank=True)
    phone = models.CharField(_('telefone'), max_length=20, blank=True)
    address = models.CharField(_('endereço'), max_length=255, blank=True)
    city = models.CharField(_('cidade'), max_length=100, blank=True)
    state = models.CharField(_('estado'), max_length=100, blank=True)
    profile_image = models.ImageField(_('imagem de perfil'), upload_to=profile_image_path, blank=True, null=True)
    created_at = models.DateTimeField(_('criado em'), auto_now_add=True)
    updated_at = models.DateTimeField(_('atualizado em'), auto_now=True)
    
    # Campos específicos para ONGs
    cnpj = models.CharField(_('CNPJ'), max_length=18, blank=True)
    description = models.TextField(_('descrição da ONG'), blank=True)
    founding_date = models.DateField(_('data de fundação'), null=True, blank=True)
    website = models.URLField(_('website'), blank=True)
    social_media = models.JSONField(_('redes sociais'), default=dict, blank=True)
    
    # Campos para responsável por ONG
    responsible_name = models.CharField(_('nome do responsável'), max_length=255, blank=True)
    responsible_phone = models.CharField(_('telefone do responsável'), max_length=20, blank=True)
    postal_code = models.CharField(_('CEP'), max_length=10, blank=True)
    
    class Meta:
        verbose_name = _('perfil')
        verbose_name_plural = _('perfis')
    
    def __str__(self):
        return f"Perfil de {self.user.email}"
    
    @property
    def profile_image_url(self):
        """Retorna a URL da imagem de perfil."""
        if self.profile_image:
            return self.profile_image.url
        return None 