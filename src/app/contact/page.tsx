import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';

export default function ContactPage() {
  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
              <CardTitle className="text-3xl font-bold text-center text-gray-900 dark:text-white">
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  If you need assistance with your account or with multifinger logging data processing, feel free to reach out:
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Email us at</p>
                      <a
                        href="mailto:admin@enertech3.com"
                        className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                      >
                        admin@enertech3.com
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950 p-6 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl mt-1">🔒</span>
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                        Privacy Notice
                      </h3>
                      <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                        Any technical or sensitive information you share with us will be treated confidentially and used solely to provide you with support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}