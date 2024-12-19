import { Menubar, MenubarMenu } from "@/components/ui/menubar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { AudioLines } from "lucide-react";
export default function PageHeader() {
  return (
    <Menubar>
      <MenubarMenu>
        <Button
          variant="ghost"
          className="w-[150px] font-bold italic justify-center"
        >
          <AudioLines />
          Rwave
        </Button>
        <Separator orientation="vertical" />
        <div></div>
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
        <Link href="/about">
          <Button variant="link" className="w-[150px]">
            <div className="font-bold">a</div>
            about
          </Button>
        </Link>
      </MenubarMenu>
    </Menubar>
  );
}
