import Link from 'next/link';
import { Button } from '@/components/ui';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/Card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Jogo de Damas Online
          </h1>
          <p className="text-xl text-gray-600">
            Jogue contra amigos, desafie a IA ou pratique sozinho
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Local Game */}
          <Card>
            <CardHeader>
              <CardTitle>🎮 Jogo Local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Jogue no mesmo dispositivo com um amigo. Perfeito para jogar
                cara a cara!
              </p>
              <Link href="/local">
                <Button fullWidth>Jogar Agora</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Online Game */}
          <Card>
            <CardHeader>
              <CardTitle>🌐 Multiplayer Online</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Crie uma sala e convide amigos para jogar online em tempo real.
              </p>
              <Link href="/online">
                <Button fullWidth>Criar Sala</Button>
              </Link>
            </CardContent>
          </Card>

          {/* Bot Game */}
          <Card>
            <CardHeader>
              <CardTitle>🤖 Jogar vs IA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Desafie a inteligência artificial em três níveis de
                dificuldade.
              </p>
              <Link href="/bot">
                <Button fullWidth>Desafiar IA</Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card variant="outlined">
          <CardContent className="py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Quer acompanhar seu progresso?
                </h3>
                <p className="text-sm text-gray-600">
                  Crie uma conta para salvar suas estatísticas e histórico de
                  partidas.
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/auth/signin">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button>Criar Conta</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
