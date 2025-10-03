import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  username: string;
  password: string;
  balance: number;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [coinsAmount, setCoinsAmount] = useState<number>(0);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    
    if (user.username !== 'админ') {
      checkAdminStatus(user.username);
    } else {
      loadUsers(user.username);
    }
  }, [navigate]);

  const checkAdminStatus = async (username: string) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/6435b3ae-872c-4ca5-8130-750f684077c3?admin_username=${username}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        toast({
          title: 'Доступ запрещен',
          description: 'У вас нет прав администратора',
          variant: 'destructive',
        });
        navigate('/journey');
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось проверить права доступа',
        variant: 'destructive',
      });
      navigate('/journey');
    }
  };

  const loadUsers = async (adminUsername: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://functions.poehali.dev/6435b3ae-872c-4ca5-8130-750f684077c3?admin_username=${adminUsername}`
      );
      const data = await response.json();
      
      if (response.ok) {
        setUsers(data.users || []);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось загрузить пользователей',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleAddCoins = async (targetUsername: string) => {
    if (!coinsAmount || coinsAmount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректное количество монет',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/6435b3ae-872c-4ca5-8130-750f684077c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_coins',
          admin_username: currentUser.username,
          target_username: targetUsername,
          coins: coinsAmount,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно',
          description: data.message,
        });
        loadUsers(currentUser.username);
        setCoinsAmount(0);
        setSelectedUser('');
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось добавить монеты',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при добавлении монет',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleBanUser = async (targetUsername: string, banStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/6435b3ae-872c-4ca5-8130-750f684077c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ban_user',
          admin_username: currentUser.username,
          target_username: targetUsername,
          ban: banStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно',
          description: data.message,
        });
        loadUsers(currentUser.username);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить статус',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при изменении статуса',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleGrantAdmin = async (targetUsername: string, grantStatus: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/6435b3ae-872c-4ca5-8130-750f684077c3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant_admin',
          admin_username: currentUser.username,
          target_username: targetUsername,
          grant: grantStatus,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Успешно',
          description: data.message,
        });
        loadUsers(currentUser.username);
      } else {
        toast({
          title: 'Ошибка',
          description: data.error || 'Не удалось изменить права',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Произошла ошибка при изменении прав',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-graffiti-dark p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-5xl font-heading font-black bg-gradient-to-r from-graffiti-pink via-graffiti-purple to-graffiti-blue bg-clip-text text-transparent">
            <Icon name="Shield" size={48} className="inline-block mr-4 text-graffiti-purple" />
            АДМИН-ПАНЕЛЬ
          </h1>
          <Button
            onClick={() => navigate('/journey')}
            variant="outline"
            className="border-graffiti-purple/30"
          >
            <Icon name="ArrowLeft" size={20} className="mr-2" />
            Назад
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-black/60 border-graffiti-purple/30 p-6">
            <div className="flex items-center gap-4">
              <Icon name="Users" size={48} className="text-graffiti-purple" />
              <div>
                <div className="text-4xl font-black text-white">{users.length}</div>
                <div className="text-white/60">Всего пользователей</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-black/60 border-graffiti-pink/30 p-6">
            <div className="flex items-center gap-4">
              <Icon name="ShieldCheck" size={48} className="text-graffiti-pink" />
              <div>
                <div className="text-4xl font-black text-white">
                  {users.filter(u => u.is_admin).length}
                </div>
                <div className="text-white/60">Администраторов</div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-black/60 border-graffiti-orange/30 p-6">
            <div className="flex items-center gap-4">
              <Icon name="Ban" size={48} className="text-graffiti-orange" />
              <div>
                <div className="text-4xl font-black text-white">
                  {users.filter(u => u.is_banned).length}
                </div>
                <div className="text-white/60">Заблокировано</div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="bg-black/60 border-graffiti-electric/30 p-6 mb-8">
          <h2 className="text-2xl font-heading font-bold text-white mb-4">
            <Icon name="Plus" size={32} className="inline-block mr-2 text-graffiti-electric" />
            Добавить монеты
          </h2>
          <div className="flex gap-4">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="flex-1 bg-graffiti-dark text-white px-4 py-2 rounded-lg border border-graffiti-electric/30 focus:border-graffiti-electric"
            >
              <option value="">Выберите пользователя</option>
              {users.map(user => (
                <option key={user.id} value={user.username}>
                  {user.username} (Баланс: {user.balance}₡)
                </option>
              ))}
            </select>
            <Input
              type="number"
              value={coinsAmount}
              onChange={(e) => setCoinsAmount(Number(e.target.value))}
              placeholder="Количество монет"
              className="w-48 bg-graffiti-dark text-white border-graffiti-electric/30"
            />
            <Button
              onClick={() => selectedUser && handleAddCoins(selectedUser)}
              disabled={loading || !selectedUser || !coinsAmount}
              className="bg-gradient-to-r from-graffiti-electric to-graffiti-blue"
            >
              <Icon name="Coins" size={20} className="mr-2" />
              Добавить
            </Button>
          </div>
        </Card>

        <Card className="bg-black/60 border-graffiti-purple/30 p-6">
          <h2 className="text-2xl font-heading font-bold text-white mb-4">
            <Icon name="Database" size={32} className="inline-block mr-2 text-graffiti-purple" />
            База данных пользователей
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-white">
              <thead>
                <tr className="border-b border-graffiti-purple/30">
                  <th className="text-left p-3">ID</th>
                  <th className="text-left p-3">Ник</th>
                  <th className="text-left p-3">Пароль (хеш)</th>
                  <th className="text-left p-3">Баланс</th>
                  <th className="text-left p-3">Дата</th>
                  <th className="text-center p-3">Админ</th>
                  <th className="text-center p-3">Бан</th>
                  <th className="text-center p-3">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-graffiti-purple/10 hover:bg-graffiti-purple/5">
                    <td className="p-3">{user.id}</td>
                    <td className="p-3 font-bold">{user.username}</td>
                    <td className="p-3 text-xs font-mono text-white/60 max-w-xs truncate">
                      {user.password}
                    </td>
                    <td className="p-3">
                      <span className="text-graffiti-electric font-bold">{user.balance}₡</span>
                    </td>
                    <td className="p-3 text-sm text-white/60">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-center">
                      {user.is_admin ? (
                        <Icon name="Check" size={20} className="text-graffiti-pink mx-auto" />
                      ) : (
                        <Icon name="X" size={20} className="text-white/30 mx-auto" />
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {user.is_banned ? (
                        <Icon name="Ban" size={20} className="text-graffiti-orange mx-auto" />
                      ) : (
                        <Icon name="Check" size={20} className="text-graffiti-electric mx-auto" />
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => handleGrantAdmin(user.username, !user.is_admin)}
                          disabled={loading}
                          size="sm"
                          className={user.is_admin ? 'bg-graffiti-orange' : 'bg-graffiti-pink'}
                        >
                          {user.is_admin ? 'Убрать' : 'Админ'}
                        </Button>
                        <Button
                          onClick={() => handleBanUser(user.username, !user.is_banned)}
                          disabled={loading}
                          size="sm"
                          variant={user.is_banned ? 'outline' : 'destructive'}
                        >
                          {user.is_banned ? 'Разбан' : 'Бан'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
