"use client";

import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import {
  Modal,
  ModalAction,
  ModalCancel,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from "../ui/dialog";
import { toast } from "../../hooks/use-toast";

// Placeholder: exclusão real de conta exige a Admin API (secret key,
// server-only, ADR-003) e uma estratégia de o que fazer com os dados do
// Studio associado — decisão de produto que ainda não foi tomada, não
// prioridade das outras seções de Sprint 1.8c. Este botão existe para
// deixar a intenção visível na UI sem implementar uma ação destrutiva
// irreversível pela metade.
export function DangerZoneSection() {
  function handleConfirm() {
    toast({
      title: "Exclusão de conta ainda não disponível",
      description: "Entre em contato com o suporte se precisar excluir sua conta agora.",
      variant: "warning",
    });
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle>Zona de risco</CardTitle>
        <CardDescription>Excluir sua conta é permanente e não pode ser desfeito.</CardDescription>
      </CardHeader>
      <CardContent>
        <Modal>
          <ModalTrigger asChild>
            <Button variant="destructive">Excluir conta</Button>
          </ModalTrigger>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Excluir sua conta?</ModalTitle>
              <ModalDescription>
                Esta ação é permanente. Todos os seus dados de acesso serão removidos e você perderá o acesso ao
                AI Game Studio OS.
              </ModalDescription>
            </ModalHeader>
            <ModalFooter>
              <ModalCancel asChild>
                <Button variant="outline">Cancelar</Button>
              </ModalCancel>
              <ModalAction asChild>
                <Button variant="destructive" onClick={handleConfirm}>
                  Excluir conta
                </Button>
              </ModalAction>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </CardContent>
    </Card>
  );
}
