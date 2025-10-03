import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('https://functions.poehali.dev/1d67167c-a8f9-4d41-b8dc-b5390a22bb25', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isLogin ? 'login' : 'register',
          username,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        toast({
          title: isLogin ? 'Вход выполнен!' : 'Регистрация успешна!',
          description: `Добро пожаловать, ${data.user.username}!`,
        });
        navigate('/journey');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Что-то пошло не так',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-graffiti-dark flex items-center justify-center px-4">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url(https://v3b.fal.media/files/b/rabbit/7j6uypkMehq11SuG28Ygf_output.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Card className="w-full max-w-md bg-black/80 border-graffiti-purple/50 p-8 relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading font-black bg-gradient-to-r from-graffiti-pink via-graffiti-purple to-graffiti-blue bg-clip-text text-transparent mb-2">
            СУБКУЛЬТУРА
          </h1>
          <p className="text-white/60">{isLogin ? 'Войди в свой аккаунт' : 'Создай новый аккаунт'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Имя пользователя</label>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="bg-black/60 border-graffiti-purple/30 text-white"
              placeholder="username"
            />
          </div>

          <div>
            <label className="text-white/80 text-sm font-medium mb-2 block">Пароль</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/60 border-graffiti-purple/30 text-white"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-graffiti-pink to-graffiti-purple hover:from-graffiti-purple hover:to-graffiti-blue text-white font-bold py-6"
          >
            {loading ? (
              <Icon name="Loader2" className="animate-spin" size={24} />
            ) : (
              <>
                <Icon name={isLogin ? 'LogIn' : 'UserPlus'} size={24} className="mr-2" />
                {isLogin ? 'ВОЙТИ' : 'РЕГИСТРАЦИЯ'}
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-graffiti-purple hover:text-graffiti-pink transition-colors text-sm"
          >
            {isLogin ? 'Нет аккаунта? Зарегистрируйся' : 'Уже есть аккаунт? Войди'}
          </button>
        </div>

        <Button
          onClick={() => navigate('/')}
          variant="ghost"
          className="w-full mt-4 text-white/60 hover:text-white"
        >
          <Icon name="ArrowLeft" size={20} className="mr-2" />
          На главную
        </Button>
      </Card>
    </div>
  );
};

export default Auth;
