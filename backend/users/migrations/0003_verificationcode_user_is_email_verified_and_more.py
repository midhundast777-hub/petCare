from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_user_avatar'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='is_email_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='is_phone_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.CreateModel(
            name='VerificationCode',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('destination', models.CharField(db_index=True, max_length=255)),
                ('code', models.CharField(max_length=10)),
                ('code_type', models.CharField(choices=[('EMAIL', 'Email'), ('PHONE', 'Phone')], default='EMAIL', max_length=10)),
                ('is_verified', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
