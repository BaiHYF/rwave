import { Menubar, MenubarMenu } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

export default function PageHeader() {
  return (
    <Menubar>
      <MenubarMenu>
        <Button variant="ghost" className="w-[150px] font-bold italic">
          Rwave
        </Button>
        <Separator orientation="vertical" />
        <Link href="/home">
          <Button variant="link" className="w-[150px]">
            <div className="font-bold">t</div>
            track
          </Button>
        </Link>
        <Separator orientation="vertical" />
        <Link href="/playlist">
          <Button variant="link" className="w-[150px]">
            <div className="font-bold">p</div>
            playlist
          </Button>
        </Link>
        <Separator orientation="vertical" />
        <Link href="/artist">
          <Button variant="link" className="w-[150px]">
            <div className="font-bold">a</div>
            artist
          </Button>
        </Link>
      </MenubarMenu>
    </Menubar>
  );
}
