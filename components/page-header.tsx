import { Menubar, MenubarMenu } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function PageHeader() {
  return (
    <Menubar>
      <MenubarMenu>
        <Button variant="ghost" className="w-[150px] font-bold italic">
          Rwave
        </Button>
        <Separator orientation="vertical" />
        <Button variant="link" className="w-[150px]">
          <div className="font-bold">t</div>
          track
        </Button>
        <Separator orientation="vertical" />
        <Button variant="link" className="w-[150px]">
          <div className="font-bold">p</div>
          playlist
        </Button>
        <Separator orientation="vertical" />
        <Button variant="link" className="w-[150px]">
          <div className="font-bold">a</div>
          artist
        </Button>
      </MenubarMenu>
    </Menubar>
  );
}
