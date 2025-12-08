import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';

const newsItems = [
  {
    id: 1,
    title: "🚀 Enertech3 launches the first version of its intelligent well integrity analysis app.",
    location: "Bogotá, Colombia",
    date: "December 09th 2025",
    content: "Enertech3 officially announces the launch of the initial version of its software for intelligent well logging analysis and data processing. This first release represents a major milestone in the digital transformation of the energy sector through automation, and advanced analytics.",
    features: [
      "📈 Efficient processing of well log files",
      "🤖 Automated anomaly detection powered.",
      "🛠 Intelligent workflows that streamline inspection routines",
      "🧠 Better and faster decision-making at critical operational stages"
    ],
    footer: "Our mission is to deliver tools that enhance technical expertise and reduce operational uncertainty. This first version is just the beginning of a continuous evolution alongside our users. With a strong focus on efficiency, accuracy, and user experience, Enertech3 will continue evolving the platform over the coming months — adding advanced analytics capabilities and AI models."
  }
];

export default function NewsPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Latest News
        </h1>
        <p className="text-lg text-muted-foreground text-center">
          Stay updated with the latest developments from Enertech3
        </p>
      </div>

      <div className="space-y-8">
        {newsItems.map((item) => (
          <Card key={item.id} className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                {item.title}
              </CardTitle>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-muted-foreground mt-2">
                <span className="font-medium">{item.location}</span>
                <span>{item.date}</span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                {item.content}
              </p>

              <div className="mb-4">
                <p className="font-semibold text-gray-900 dark:text-white mb-2">
                  Specifically designed for well integrity engineers, field specialists, and anyone involved in assessing well integrity, the solution enables:
                </p>
                <ul className="space-y-2">
                  {item.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-lg mr-2">{feature.split(' ')[0]}</span>
                      <span className="text-gray-700 dark:text-gray-300">{feature.substring(feature.indexOf(' ') + 1)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-gray-700 dark:text-gray-300 leading-relaxed italic">
                {item.footer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
    </>
  );
}