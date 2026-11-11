import { Button } from "@/components/ui/button";

import { logoutAction } from "../server/actions";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button type="submit" variant="outline" size="sm">
        Sair
      </Button>
    </form>
  );
}
