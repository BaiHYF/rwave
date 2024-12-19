import { ScrollArea } from "@/components/ui/scroll-area";

export default function AboutPageBody() {
  return (
    <div className="space-y-2 mb-4 w-[450px] flex-none">
      <ScrollArea className="h-[200px] overflow-hidden flex">
        <p>Ciallo (∠·ω )⌒★ 欢迎来到这个界面☕</p>
        <p>首先，非常感谢您使用rwave，一百万次谢谢您！🌹</p>
        <p>
          rwave是一个简单的本地音乐文件管理程序（虽然目前只支持管理.mp3格式），如果您在本地有很多的音乐存储，并且厌倦了主流音乐应用缓慢的启动速度与（如果你没有购买会员的话）烦人的广告😡，
          那么rwave也许可以是您的一个选择🥳。
        </p>
        <p>
          您现在看到的是rwave
          alpha1.0测试版本，它可能仍存在很多问题（BUG）🤔，请多多包涵🥺。
        </p>
        <p>
          如果您有意愿对本应用使用体验做出任何的反馈，欢迎通过邮件发送到
          baiheyufei@gmail.com
        </p>
        <p></p>
      </ScrollArea>
    </div>
  );
}
