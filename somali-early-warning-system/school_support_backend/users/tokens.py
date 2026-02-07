from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom fields inside the JWT token payload
        token["user_id"] = user.id        # ✅ REQUIRED
        token["role"] = user.role
        token["name"] = user.name
        token["email"] = user.email

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # ALSO return custom fields in login response body
        data["user_id"] = self.user.id    # ✅ REQUIRED
        data["role"] = self.user.role
        data["name"] = self.user.name
        data["email"] = self.user.email

        return data
