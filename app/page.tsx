import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, DatabaseZap, Terminal, Code, Database } from "lucide-react"; // Example icons
import Link from 'next/link';

// You can easily add more tools to this array
const tools = [
  {
    title: "Redis Connection Tester",
    description: "Quickly test and troubleshoot your Redis server connections online.",
    href: "/redis-tester", // The route to your tool page
    icon: <DatabaseZap className="h-8 w-8 text-primary" />,
  },
  {
    title: "MongoDB Manager",
    description: "Fully manage your MongoDB connections online.",
    href: "/mongodb", // The route to your tool page
    icon: <Database className="h-8 w-8 text-primary" />,
  },
  // --- Add your new tool objects here ---
  // {
  //   title: "New Amazing Tool",
  //   description: "A brief description of what this amazing tool does.",
  //   href: "/new-amazing-tool",
  //   icon: <YourIconComponent className="h-8 w-8 text-primary" />,
  // },
];

export default function DIToolsHome() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">DITools</h1>
          <p className="mt-2 text-lg text-primary-foreground/80">
            Do-It-Together
          </p>
        </div>
      </header>

      {/* Tools Grid Section */}
      <div className="flex-grow container mx-auto px-4 py-16">
        <h2 className="text-3xl font-semibold text-center mb-10">Our Collection of Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tools.map((tool) => (
            <Link href={tool.href} key={tool.title} legacyBehavior>
              <a className="block transform hover:-translate-y-1.5 transition-transform duration-300">
                <Card className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader className="flex-row items-center gap-4 pb-4">
                    {tool.icon}
                    <CardTitle>{tool.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              </a>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}