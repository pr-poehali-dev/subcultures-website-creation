import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface User {
  id: number;
  username: string;
  balance: number;
}

interface Gift {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: string;
  purchased?: boolean;
}

const Journey = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCity, setActiveCity] = useState<string>('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
      loadGifts(JSON.parse(userStr).id);
    }
  }, []);

  const loadGifts = async (userId: number) => {
    try {
      const response = await fetch(`https://functions.poehali.dev/e3cff682-44c4-4ca5-a1dc-cf7aed0b0fce?user_id=${userId}`);
      const data = await response.json();
      setGifts(data.gifts || []);
    } catch (error) {
      console.error('Failed to load gifts:', error);
    }
  };

  const handlePurchase = async (giftId: number, price: number) => {
    if (!user) {
      toast({
        title: 'Требуется вход',
        description: 'Войдите в аккаунт для покупки подарков',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (user.balance < price) {
      toast({
        title: 'Недостаточно средств',
        description: `Нужно ${price} субкоинов, у вас ${user.balance}`,
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('https://functions.poehali.dev/e3cff682-44c4-4ca5-a1dc-cf7aed0b0fce', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, gift_id: giftId }),
      });

      const data = await response.json();
      if (data.success) {
        const updatedUser = { ...user, balance: data.new_balance };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        loadGifts(user.id);
        toast({
          title: 'Подарок куплен!',
          description: `Остаток: ${data.new_balance} ₡`,
        });
      } else {
        toast({
          title: 'Ошибка',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось купить подарок',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    navigate('/auth');
  };

  const cities = [
    {
      id: 'gotovs',
      name: 'Готовс',
      icon: 'Skull',
      color: 'from-graffiti-purple to-graffiti-pink',
      description: 'Темный город готической субкультуры',
      population: '850K',
    },
    {
      id: 'emovsk',
      name: 'Эмовск',
      icon: 'Heart',
      color: 'from-graffiti-pink to-graffiti-purple',
      description: 'Эмоциональный центр чувств и переживаний',
      population: '650K',
    },
  ];

  const sections = [
    { id: 'cities', name: 'Города', icon: 'Building2' },
    { id: 'gotovs', name: 'Готовс', icon: 'Skull' },
    { id: 'emovsk', name: 'Эмовск', icon: 'Heart' },
    { id: 'map', name: 'Карта', icon: 'Map' },
    { id: 'games', name: 'Мини-игры', icon: 'Gamepad2' },
    { id: 'gifts', name: 'Подарки', icon: 'Gift' },
    { id: 'currency', name: 'Валюта', icon: 'Coins' },
    { id: 'shop', name: 'Магазин валюты', icon: 'ShoppingBag' },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-graffiti-dark">
      <nav className="sticky top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-graffiti-purple/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="text-2xl font-heading font-black bg-gradient-to-r from-graffiti-pink via-graffiti-purple to-graffiti-blue bg-clip-text text-transparent">
              СУБКУЛЬТУРА
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="bg-graffiti-purple/20 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Icon name="Coins" size={20} className="text-graffiti-electric" />
                    <span className="text-white font-bold">{user.balance} ₡</span>
                  </div>
                  <div className="bg-graffiti-pink/20 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Icon name="User" size={20} className="text-graffiti-pink" />
                    <span className="text-white">{user.username}</span>
                  </div>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-white/60 hover:text-white"
                  >
                    <Icon name="LogOut" size={20} />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-graffiti-pink to-graffiti-purple hover:from-graffiti-purple hover:to-graffiti-blue"
                >
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-all hover:scale-110 duration-300 whitespace-nowrap"
              >
                <Icon name={section.icon as any} size={20} />
                <span className="text-sm font-medium">{section.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div>
        <section id="cities" className="py-20 px-4">
          <div className="container mx-auto">
            <h2 className="text-5xl md:text-6xl font-heading font-black text-center mb-16 bg-gradient-to-r from-graffiti-pink to-graffiti-purple bg-clip-text text-transparent">
              ГОРОДА
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {cities.map((city) => (
                <Card
                  key={city.id}
                  onClick={() => setActiveCity(city.id)}
                  className={`group relative p-8 bg-gradient-to-br ${city.color} cursor-pointer transition-all duration-300 hover:scale-110 border-2 border-white/20 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <Icon
                        name={city.icon as any}
                        size={64}
                        className="text-white transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12"
                      />
                      <div className="text-right">
                        <div className="text-sm text-white/60">Население</div>
                        <div className="text-2xl font-bold text-white">{city.population}</div>
                      </div>
                    </div>
                    <h3 className="text-4xl font-heading font-black text-white mb-3">{city.name}</h3>
                    <p className="text-white/80 text-lg">{city.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="gotovs" className="py-20 px-4 bg-gradient-to-br from-graffiti-purple/10 to-black">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
              <Icon name="Skull" size={48} className="text-graffiti-purple" />
              <h2 className="text-5xl font-heading font-black text-graffiti-purple">ГОТОВС</h2>
            </div>
            <Card className="bg-black/60 border-graffiti-purple/30 p-8">
              <p className="text-white/80 text-lg mb-6">
                Готовс — центр готической субкультуры. Здесь царит атмосфера мистики, темной романтики и философских размышлений о жизни и смерти.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Замок Теней', 'Кладбище Грез', 'Театр Ночи', 'Библиотека Тьмы'].map((place) => (
                  <div
                    key={place}
                    className="bg-graffiti-purple/20 p-4 rounded-lg text-center hover:scale-110 transition-transform duration-300 cursor-pointer"
                  >
                    <Icon name="MapPin" size={32} className="text-graffiti-purple mx-auto mb-2" />
                    <div className="text-white text-sm font-medium">{place}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="emovsk" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
              <Icon name="Heart" size={48} className="text-graffiti-pink" />
              <h2 className="text-5xl font-heading font-black text-graffiti-pink">ЭМОВСК</h2>
            </div>
            <Card className="bg-black/60 border-graffiti-pink/30 p-8">
              <p className="text-white/80 text-lg mb-6">
                Эмовск — город эмоций и самовыражения. Здесь каждый может быть собой, делиться чувствами и находить понимание.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Парк Чувств', 'Арт-Квартал', 'Музей Эмоций', 'Кафе Слёз'].map((place) => (
                  <div
                    key={place}
                    className="bg-graffiti-pink/20 p-4 rounded-lg text-center hover:scale-110 transition-transform duration-300 cursor-pointer"
                  >
                    <Icon name="MapPin" size={32} className="text-graffiti-pink mx-auto mb-2" />
                    <div className="text-white text-sm font-medium">{place}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section id="map" className="py-20 px-4 bg-gradient-to-br from-graffiti-blue/10 to-black">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-5xl md:text-6xl font-heading font-black text-center mb-12 text-graffiti-electric">
              <Icon name="Map" size={48} className="inline-block mr-4" />
              КАРТА ОБЛАСТИ
            </h2>
            <Card className="bg-black/60 border-graffiti-electric/30 p-8">
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-graffiti-purple via-graffiti-blue to-graffiti-pink p-8">
                <div className="absolute top-1/4 left-1/4 group cursor-pointer">
                  <div className="bg-graffiti-purple rounded-full p-4 hover:scale-150 transition-transform duration-300 shadow-xl">
                    <Icon name="Skull" size={32} className="text-white" />
                  </div>
                  <div className="text-white font-bold mt-2 text-center">Готовс</div>
                </div>
                <div className="absolute bottom-1/3 right-1/3 group cursor-pointer">
                  <div className="bg-graffiti-pink rounded-full p-4 hover:scale-150 transition-transform duration-300 shadow-xl">
                    <Icon name="Heart" size={32} className="text-white" />
                  </div>
                  <div className="text-white font-bold mt-2 text-center">Эмовск</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="games" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-5xl font-heading font-black text-center mb-12 text-graffiti-orange">
              <Icon name="Gamepad2" size={48} className="inline-block mr-4" />
              МИНИ-ИГРЫ
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Граффити Битва', icon: 'Paintbrush' },
                { name: 'Субкультурный Квиз', icon: 'Brain' },
                { name: 'Музыкальный Баттл', icon: 'Music' },
              ].map((game) => (
                <Card
                  key={game.name}
                  className="bg-black/60 border-graffiti-orange/30 p-6 hover:scale-110 transition-all duration-300 cursor-pointer group"
                >
                  <Icon
                    name={game.icon as any}
                    size={48}
                    className="text-graffiti-orange mx-auto mb-4 group-hover:scale-125 transition-transform"
                  />
                  <h3 className="text-xl font-bold text-white text-center">{game.name}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="gifts" className="py-20 px-4 bg-gradient-to-br from-graffiti-pink/10 to-black">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-5xl font-heading font-black text-center mb-12 text-graffiti-pink">
              <Icon name="Gift" size={48} className="inline-block mr-4" />
              МАГАЗИН ПОДАРКОВ
            </h2>
            {!user && (
              <div className="text-center mb-8">
                <p className="text-white/60 mb-4">Войдите в аккаунт для покупки подарков</p>
                <Button
                  onClick={() => navigate('/auth')}
                  className="bg-gradient-to-r from-graffiti-pink to-graffiti-purple"
                >
                  <Icon name="LogIn" size={20} className="mr-2" />
                  Войти
                </Button>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-6">
              {gifts.map((gift) => (
                <Card
                  key={gift.id}
                  className={`bg-black/60 border-graffiti-pink/30 p-6 transition-all duration-300 ${
                    gift.purchased ? 'opacity-50' : 'hover:scale-105 cursor-pointer'
                  }`}
                >
                  <div className="text-center mb-4">
                    <Icon
                      name={gift.icon as any}
                      size={64}
                      className={`mx-auto mb-4 ${gift.purchased ? 'text-white/40' : 'text-graffiti-pink'}`}
                    />
                    <h3 className="text-xl font-bold text-white mb-2">{gift.name}</h3>
                    <p className="text-white/60 text-sm mb-4">{gift.description}</p>
                    <div className="text-3xl font-black text-graffiti-pink mb-4">₡{gift.price}</div>
                  </div>
                  {gift.purchased ? (
                    <div className="bg-graffiti-purple/20 text-white py-3 px-6 rounded-lg text-center font-bold">
                      <Icon name="Check" size={20} className="inline-block mr-2" />
                      Куплено
                    </div>
                  ) : (
                    <Button
                      onClick={() => handlePurchase(gift.id, gift.price)}
                      disabled={loading || !user}
                      className="w-full bg-gradient-to-r from-graffiti-pink to-graffiti-purple hover:from-graffiti-purple hover:to-graffiti-blue"
                    >
                      {loading ? 'Покупка...' : 'Купить'}
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="currency" className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-5xl font-heading font-black text-center mb-12 text-graffiti-electric">
              <Icon name="Coins" size={48} className="inline-block mr-4" />
              ВАЛЮТА
            </h2>
            <Card className="bg-gradient-to-br from-graffiti-blue to-graffiti-electric border-graffiti-electric/50 p-8 text-center">
              <div className="text-8xl font-black text-white mb-4">₡</div>
              <h3 className="text-3xl font-heading font-bold text-white mb-4">СУБКОИНЫ</h3>
              <p className="text-white/80 text-lg mb-6">
                Основная валюта субкультурной области. Зарабатывай играя, получай подарки и покупай уникальные предметы.
              </p>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">Заработай</div>
                  <Icon name="TrendingUp" size={32} className="text-graffiti-electric mx-auto mt-2" />
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">Копи</div>
                  <Icon name="Wallet" size={32} className="text-graffiti-electric mx-auto mt-2" />
                </div>
                <div className="bg-white/10 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-white">Трать</div>
                  <Icon name="ShoppingCart" size={32} className="text-graffiti-electric mx-auto mt-2" />
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section id="shop" className="py-20 px-4 bg-gradient-to-br from-graffiti-orange/10 to-black">
          <div className="container mx-auto max-w-5xl">
            <h2 className="text-5xl font-heading font-black text-center mb-12 text-graffiti-orange">
              <Icon name="ShoppingBag" size={48} className="inline-block mr-4" />
              МАГАЗИН ВАЛЮТЫ
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { amount: '500', price: '₽99', bonus: '' },
                { amount: '1200', price: '₽199', bonus: '+200 бонус' },
                { amount: '3000', price: '₽499', bonus: '+500 бонус' },
              ].map((pack) => (
                <Card
                  key={pack.amount}
                  className="bg-black/60 border-graffiti-orange/30 p-6 hover:scale-110 transition-all duration-300 cursor-pointer text-center"
                >
                  <div className="text-6xl font-black text-graffiti-orange mb-2">₡{pack.amount}</div>
                  {pack.bonus && <div className="text-sm text-graffiti-electric mb-4">{pack.bonus}</div>}
                  <div className="text-3xl font-bold text-white mb-6">{pack.price}</div>
                  <Button className="w-full bg-gradient-to-r from-graffiti-orange to-graffiti-pink hover:from-graffiti-pink hover:to-graffiti-orange text-white font-bold">
                    КУПИТЬ
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-12 px-4 bg-black/60 border-t border-graffiti-purple/30">
          <div className="container mx-auto text-center">
            <div className="text-3xl font-heading font-black mb-4 bg-gradient-to-r from-graffiti-pink via-graffiti-purple to-graffiti-blue bg-clip-text text-transparent">
              СУБКУЛЬТУРНАЯ ОБЛАСТЬ
            </div>
            <p className="text-white/60">© 2024 Все права защищены</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Journey;