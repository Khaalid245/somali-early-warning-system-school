from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom fields to JWT payload
        token["role"] = user.role
        token["email"] = user.email
        token["name"] = user.name

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Include the same values in the login response
        data["role"] = self.user.role
        data["email"] = self.user.email
        data["name"] = self.user.name

        return data
