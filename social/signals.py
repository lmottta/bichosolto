from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Post, Comment, Like, Follower


@receiver(post_save, sender=Like)
def update_post_likes_count(sender, instance, created, **kwargs):
    """
    Atualizar contadores em cache quando uma curtida é criada.
    """
    if created:
        # Aqui poderia ser implementado um sistema de notificações
        pass


@receiver(post_save, sender=Comment)
def update_post_comments_count(sender, instance, created, **kwargs):
    """
    Atualizar contadores em cache quando um comentário é criado.
    """
    if created:
        # Aqui poderia ser implementado um sistema de notificações
        pass


@receiver(post_save, sender=Follower)
def create_follower_notification(sender, instance, created, **kwargs):
    """
    Criar notificação quando alguém começa a seguir um usuário.
    """
    if created:
        # Aqui poderia ser implementado um sistema de notificações
        pass 