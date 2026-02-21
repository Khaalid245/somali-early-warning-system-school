from django.db import models
from django.core.exceptions import ValidationError

class OptimisticLockMixin(models.Model):
    version = models.IntegerField(default=1)
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        if self.pk:
            # Get current version from database
            current = self.__class__.objects.filter(pk=self.pk).first()
            if current and current.version != self.version:
                raise ValidationError(
                    f'{self.__class__.__name__} was modified by another user. Please refresh and try again.'
                )
            self.version += 1
        super().save(*args, **kwargs)
    
    @classmethod
    def update_with_version(cls, pk, version, **updates):
        """Safe update with version check"""
        obj = cls.objects.filter(pk=pk, version=version).first()
        if not obj:
            raise ValidationError('Resource was modified by another user')
        
        for key, value in updates.items():
            setattr(obj, key, value)
        
        obj.save()
        return obj
