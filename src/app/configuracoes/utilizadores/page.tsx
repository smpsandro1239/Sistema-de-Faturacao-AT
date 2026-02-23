"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Mail,
  Key,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function UtilizadoresPage() {
  const [utilizadores, setUtilizadores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    password: "",
    perfil: "OPERADOR"
  });

  useEffect(() => {
    fetchUtilizadores();
    const stored = localStorage.getItem("utilizador");
    if (stored) setCurrentUser(JSON.parse(stored));
  }, []);

  const fetchUtilizadores = async () => {
    try {
      const res = await fetch("/api/utilizadores");
      if (res.ok) {
        const data = await res.json();
        setUtilizadores(data);
      }
    } catch (error) {
      toast.error("Erro ao carregar utilizadores");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.nome || !formData.email || !formData.password) {
      return toast.error("Preencha todos os campos obrigatórios");
    }

    try {
      const res = await fetch("/api/utilizadores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success("Utilizador criado com sucesso!");
        setIsAddDialogOpen(false);
        setFormData({ nome: "", email: "", password: "", perfil: "OPERADOR" });
        fetchUtilizadores();
      } else {
        const error = await res.json();
        toast.error(error.error || "Erro ao criar utilizador");
      }
    } catch (error) {
      toast.error("Erro na ligação ao servidor");
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/utilizadores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !currentStatus })
      });

      if (res.ok) {
        toast.success("Estado atualizado");
        fetchUtilizadores();
      }
    } catch (error) {
      toast.error("Erro ao atualizar estado");
    }
  };

  const getPerfilBadge = (perfil: string) => {
    switch (perfil) {
      case "ADMIN": return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Administrador</Badge>;
      case "GESTOR": return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">Gestor</Badge>;
      case "OPERADOR": return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">Operador</Badge>;
      case "CONSULTA": return <Badge variant="outline">Consulta</Badge>;
      default: return <Badge variant="secondary">{perfil}</Badge>;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipa e Utilizadores</h1>
          <p className="text-slate-500">Gerencie quem tem acesso ao sistema e quais as suas permissões.</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Convidar Utilizador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Utilizador</DialogTitle>
              <DialogDescription>
                Crie as credenciais de acesso para um novo membro da equipa.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome Completo</label>
                <Input
                  placeholder="Ex: João Silva"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Profissional</label>
                <Input
                  type="email"
                  placeholder="joao@empresa.pt"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Palavra-passe Inicial</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Perfil de Acesso (RBAC)</label>
                <Select
                  value={formData.perfil}
                  onValueChange={(val) => setFormData({...formData, perfil: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador (Total)</SelectItem>
                    <SelectItem value="GESTOR">Gestor (Faturação + Relatórios)</SelectItem>
                    <SelectItem value="OPERADOR">Operador (Apenas Vendas)</SelectItem>
                    <SelectItem value="CONSULTA">Consulta (Apenas Leitura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
              <Button className="bg-emerald-600" onClick={handleAddUser}>Criar Utilizador</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Membros Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y border-t">
              {loading ? (
                <div className="p-8 text-center text-slate-400 italic">A carregar utilizadores...</div>
              ) : utilizadores.length === 0 ? (
                <div className="p-8 text-center text-slate-400 italic">Nenhum utilizador encontrado.</div>
              ) : (
                utilizadores.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{u.nome}</p>
                          {currentUser?.email === u.email && <Badge variant="secondary" className="text-[10px]">Tu</Badge>}
                        </div>
                        <p className="text-sm text-slate-500">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div>
                        {getPerfilBadge(u.perfil)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={u.ativo ? "text-amber-600" : "text-emerald-600"}
                          onClick={() => toggleUserStatus(u.id, u.ativo)}
                        >
                          {u.ativo ? "Desativar" : "Reativar"}
                        </Button>
                        <Button variant="ghost" size="icon" className="text-slate-400">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Segurança do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-500 space-y-4">
              <p>Os perfis de acesso garantem que apenas pessoal autorizado pode emitir documentos fiscais ou exportar o SAF-T.</p>
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Administrador:</p>
                <p>Controlo total, incluindo definições fiscais e gestão de equipa.</p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-slate-700">Gestor:</p>
                <p>Pode ver relatórios e gerir faturas, mas não altera a configuração da empresa.</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-emerald-600">
                <UserCheck className="h-4 w-4" />
                <span>JWT Ativo</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
