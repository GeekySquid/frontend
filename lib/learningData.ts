import { Module, LearningPath, Achievement } from './learningSystem';

// Core Learning Modules
export const learningModules: Module[] = [
  {
    id: 'fundamentals-101',
    title: 'Market Fundamentals',
    description: 'Essential concepts every investor needs to know - perfect for beginners',
    category: 'fundamentals',
    difficulty: 'beginner',
    estimatedHours: 8,
    prerequisites: [],
    marketRelevance: ['always-relevant'],
    lessons: [
      {
        id: 'what-is-stock-market',
        title: 'What is the Stock Market?',
        description: 'Understanding the basics of stock markets and how they work',
        duration: 30,
        difficulty: 'beginner',
        prerequisites: [],
        learningObjectives: [
          'Define what a stock market is',
          'Understand the role of exchanges',
          'Identify key market participants',
          'Explain price discovery mechanism'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'intro',
              title: 'Introduction to Stock Markets',
              type: 'text',
              content: 'The stock market is a collection of markets where stocks (pieces of ownership in businesses) are traded between investors. It usually refers to the exchanges where stocks and other securities are bought and sold.'
            },
            {
              id: 'participants',
              title: 'Market Participants',
              type: 'interactive',
              content: 'Interactive diagram showing different market participants',
              metadata: {
                interactiveType: 'participant-diagram'
              }
            },
            {
              id: 'price-discovery',
              title: 'How Prices Are Set',
              type: 'chart',
              content: 'Supply and demand curves showing price discovery',
              metadata: {
                chartData: {
                  type: 'supply-demand',
                  data: []
                }
              }
            }
          ]
        },
        quiz: {
          id: 'fundamentals-quiz-1',
          passingScore: 80,
          questions: [
            {
              id: 'q1',
              type: 'multiple-choice',
              question: 'What determines stock prices in the market?',
              options: [
                'Government regulations',
                'Supply and demand',
                'Company executives',
                'Random fluctuations'
              ],
              correctAnswer: 'Supply and demand',
              explanation: 'Stock prices are determined by the interaction of supply (sellers) and demand (buyers) in the market.',
              points: 10,
              difficulty: 'easy'
            }
          ]
        }
      },
      {
        id: 'types-of-investments',
        title: 'Types of Investments',
        description: 'Exploring different investment vehicles and asset classes',
        duration: 45,
        difficulty: 'beginner',
        prerequisites: ['what-is-stock-market'],
        learningObjectives: [
          'Differentiate between stocks, bonds, and other securities',
          'Understand risk-return profiles',
          'Identify suitable investments for different goals'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'asset-classes',
              title: 'Major Asset Classes',
              type: 'interactive',
              content: 'Interactive comparison of stocks, bonds, commodities, and real estate',
              metadata: {
                interactiveType: 'asset-comparison'
              }
            }
          ]
        }
      },
      {
        id: 'market-orders-basics',
        title: 'Market Orders & Trading Basics',
        description: 'Learn how to place orders and execute trades',
        duration: 40,
        difficulty: 'beginner',
        prerequisites: ['types-of-investments'],
        learningObjectives: [
          'Understand different order types',
          'Learn bid-ask spreads',
          'Execute your first trade simulation'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'order-types',
              title: 'Order Types Explained',
              type: 'interactive',
              content: 'Interactive order book simulation',
              metadata: {
                interactiveType: 'order-book'
              }
            }
          ]
        }
      }
    ]
  },
  {
    id: 'technical-analysis-101',
    title: 'Technical Analysis Fundamentals',
    description: 'Master chart reading and pattern recognition for better trading decisions',
    category: 'technical-analysis',
    difficulty: 'intermediate',
    estimatedHours: 12,
    prerequisites: ['fundamentals-101'],
    marketRelevance: ['high-volatility', 'always-relevant'],
    lessons: [
      {
        id: 'chart-basics',
        title: 'Reading Stock Charts',
        description: 'Understanding candlesticks, volume, and timeframes',
        duration: 60,
        difficulty: 'intermediate',
        prerequisites: [],
        learningObjectives: [
          'Read candlestick charts',
          'Understand volume analysis',
          'Choose appropriate timeframes'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'candlestick-anatomy',
              title: 'Anatomy of a Candlestick',
              type: 'interactive',
              content: 'Interactive candlestick breakdown',
              metadata: {
                interactiveType: 'candlestick-builder'
              }
            }
          ]
        },
        practicalExercise: {
          id: 'chart-reading-exercise',
          title: 'Chart Pattern Recognition',
          description: 'Identify patterns in real market data',
          type: 'chart-analysis',
          instructions: [
            'Analyze the provided chart',
            'Identify support and resistance levels',
            'Mark any patterns you observe'
          ],
          expectedOutcome: 'Correctly identify at least 3 key levels and 1 pattern',
          hints: [
            'Look for areas where price bounced multiple times',
            'Check for symmetrical patterns'
          ]
        }
      },
      {
        id: 'support-resistance',
        title: 'Support & Resistance Levels',
        description: 'Identify key price levels that matter',
        duration: 50,
        difficulty: 'intermediate',
        prerequisites: ['chart-basics'],
        learningObjectives: [
          'Draw support and resistance lines',
          'Understand psychological price levels',
          'Use levels for entry and exit points'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'level-drawing',
              title: 'Drawing Key Levels',
              type: 'interactive',
              content: 'Interactive chart drawing tool',
              metadata: {
                interactiveType: 'chart-drawing'
              }
            }
          ]
        }
      },
      {
        id: 'trend-analysis',
        title: 'Trend Analysis & Moving Averages',
        description: 'Identify market trends and use moving averages effectively',
        duration: 55,
        difficulty: 'intermediate',
        prerequisites: ['support-resistance'],
        learningObjectives: [
          'Identify uptrends, downtrends, and sideways markets',
          'Use moving averages for trend confirmation',
          'Apply trend-following strategies'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'trend-identification',
              title: 'Trend Identification',
              type: 'interactive',
              content: 'Interactive trend analysis tool',
              metadata: {
                interactiveType: 'trend-analyzer'
              }
            }
          ]
        }
      }
    ]
  },
  {
    id: 'risk-management-pro',
    title: 'Professional Risk Management',
    description: 'Advanced strategies for protecting your capital and maximizing returns',
    category: 'risk-management',
    difficulty: 'advanced',
    estimatedHours: 15,
    prerequisites: ['fundamentals-101', 'technical-analysis-101'],
    marketRelevance: ['bear-market', 'high-volatility', 'market-crash'],
    lessons: [
      {
        id: 'position-sizing',
        title: 'Position Sizing Strategies',
        description: 'Calculate optimal position sizes for different risk levels',
        duration: 90,
        difficulty: 'advanced',
        prerequisites: [],
        learningObjectives: [
          'Calculate position sizes using various methods',
          'Understand risk-reward ratios',
          'Apply Kelly Criterion'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'kelly-calculator',
              title: 'Kelly Criterion Calculator',
              type: 'interactive',
              content: 'Interactive Kelly Criterion calculator',
              metadata: {
                interactiveType: 'kelly-calculator'
              }
            }
          ]
        }
      },
      {
        id: 'stop-loss-strategies',
        title: 'Stop-Loss & Take-Profit Strategies',
        description: 'Master the art of cutting losses and taking profits',
        duration: 75,
        difficulty: 'advanced',
        prerequisites: ['position-sizing'],
        learningObjectives: [
          'Set effective stop-loss levels',
          'Use trailing stops',
          'Implement take-profit strategies'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'stop-loss-calculator',
              title: 'Stop-Loss Calculator',
              type: 'interactive',
              content: 'Interactive stop-loss and take-profit calculator',
              metadata: {
                interactiveType: 'stop-loss-tool'
              }
            }
          ]
        }
      }
    ]
  },
  {
    id: 'options-trading-mastery',
    title: 'Options Trading Mastery',
    description: 'Advanced derivatives trading for sophisticated investors',
    category: 'derivatives',
    difficulty: 'advanced',
    estimatedHours: 20,
    prerequisites: ['fundamentals-101', 'technical-analysis-101', 'risk-management-pro'],
    marketRelevance: ['high-volatility', 'earnings-season'],
    lessons: [
      {
        id: 'options-basics',
        title: 'Options Fundamentals',
        description: 'Understanding calls, puts, and basic options mechanics',
        duration: 80,
        difficulty: 'advanced',
        prerequisites: [],
        learningObjectives: [
          'Understand call and put options',
          'Learn options pricing factors',
          'Calculate intrinsic and time value'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'options-simulator',
              title: 'Options Pricing Simulator',
              type: 'interactive',
              content: 'Interactive options pricing tool',
              metadata: {
                interactiveType: 'options-pricer'
              }
            }
          ]
        }
      },
      {
        id: 'options-strategies',
        title: 'Options Strategies',
        description: 'Learn covered calls, protective puts, and spreads',
        duration: 95,
        difficulty: 'advanced',
        prerequisites: ['options-basics'],
        learningObjectives: [
          'Implement basic options strategies',
          'Understand risk/reward profiles',
          'Choose appropriate strategies for market conditions'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'strategy-builder',
              title: 'Options Strategy Builder',
              type: 'interactive',
              content: 'Interactive options strategy analyzer',
              metadata: {
                interactiveType: 'strategy-builder'
              }
            }
          ]
        }
      }
    ]
  },
  {
    id: 'portfolio-management',
    title: 'Portfolio Management & Asset Allocation',
    description: 'Build and manage diversified investment portfolios',
    category: 'portfolio-management',
    difficulty: 'intermediate',
    estimatedHours: 10,
    prerequisites: ['fundamentals-101'],
    marketRelevance: ['always-relevant', 'bear-market'],
    lessons: [
      {
        id: 'diversification-principles',
        title: 'Diversification Principles',
        description: 'Learn how to spread risk across different assets',
        duration: 60,
        difficulty: 'intermediate',
        prerequisites: [],
        learningObjectives: [
          'Understand correlation and diversification',
          'Build a balanced portfolio',
          'Rebalance portfolios effectively'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'portfolio-builder',
              title: 'Portfolio Builder Tool',
              type: 'interactive',
              content: 'Interactive portfolio construction tool',
              metadata: {
                interactiveType: 'portfolio-builder'
              }
            }
          ]
        }
      },
      {
        id: 'asset-allocation',
        title: 'Strategic Asset Allocation',
        description: 'Determine optimal asset mix for your goals',
        duration: 70,
        difficulty: 'intermediate',
        prerequisites: ['diversification-principles'],
        learningObjectives: [
          'Calculate target asset allocation',
          'Understand risk tolerance impact',
          'Implement age-based strategies'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'allocation-calculator',
              title: 'Asset Allocation Calculator',
              type: 'interactive',
              content: 'Interactive asset allocation tool',
              metadata: {
                interactiveType: 'allocation-tool'
              }
            }
          ]
        }
      }
    ]
  },
  {
    id: 'crypto-trading-101',
    title: 'Cryptocurrency Trading Fundamentals',
    description: 'Navigate the exciting world of digital assets and DeFi',
    category: 'crypto-trading',
    difficulty: 'intermediate',
    estimatedHours: 14,
    prerequisites: ['fundamentals-101', 'technical-analysis-101'],
    marketRelevance: ['high-volatility', 'always-relevant'],
    lessons: [
      {
        id: 'crypto-basics',
        title: 'Cryptocurrency Fundamentals',
        description: 'Understanding blockchain, Bitcoin, and altcoins',
        duration: 65,
        difficulty: 'intermediate',
        prerequisites: [],
        learningObjectives: [
          'Understand blockchain technology',
          'Learn about major cryptocurrencies',
          'Navigate crypto exchanges safely'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'blockchain-explorer',
              title: 'Blockchain Explorer',
              type: 'interactive',
              content: 'Interactive blockchain transaction explorer',
              metadata: {
                interactiveType: 'blockchain-explorer'
              }
            }
          ]
        }
      },
      {
        id: 'defi-basics',
        title: 'DeFi & Yield Farming',
        description: 'Explore decentralized finance opportunities',
        duration: 80,
        difficulty: 'intermediate',
        prerequisites: ['crypto-basics'],
        learningObjectives: [
          'Understand DeFi protocols',
          'Learn about yield farming',
          'Assess DeFi risks and rewards'
        ],
        content: {
          type: 'interactive',
          sections: [
            {
              id: 'defi-simulator',
              title: 'DeFi Yield Calculator',
              type: 'interactive',
              content: 'Interactive DeFi yield farming simulator',
              metadata: {
                interactiveType: 'defi-calculator'
              }
            }
          ]
        }
      }
    ]
  }
];

// Learning Paths
export const learningPaths: LearningPath[] = [
  {
    id: 'beginner-investor',
    name: 'Complete Beginner to Confident Investor',
    description: 'Start from zero and build a solid foundation in investing',
    targetAudience: 'beginner',
    estimatedWeeks: 8,
    modules: ['fundamentals-101', 'technical-analysis-101', 'risk-management-pro'],
    goals: [
      'Understand market basics',
      'Make informed investment decisions',
      'Manage risk effectively'
    ],
    careerOutcomes: [
      'Personal portfolio management',
      'Entry-level finance roles',
      'Investment club participation'
    ]
  },
  {
    id: 'day-trader-path',
    name: 'Day Trading Mastery',
    description: 'Intensive program for aspiring day traders',
    targetAudience: 'intermediate',
    estimatedWeeks: 12,
    modules: ['technical-analysis-101', 'risk-management-pro'],
    goals: [
      'Master short-term trading',
      'Develop trading psychology',
      'Build consistent strategies'
    ],
    careerOutcomes: [
      'Professional day trader',
      'Prop trading firm roles',
      'Trading mentor/educator'
    ]
  }
];

// Achievement System
export const achievements: Achievement[] = [
  {
    id: 'first-lesson',
    name: 'Getting Started',
    description: 'Complete your first lesson',
    badgeUrl: '/badges/first-lesson.svg',
    unlockedDate: new Date(),
    category: 'learning'
  },
  {
    id: 'quiz-master',
    name: 'Quiz Master',
    description: 'Score 100% on 5 quizzes',
    badgeUrl: '/badges/quiz-master.svg',
    unlockedDate: new Date(),
    category: 'quiz'
  },
  {
    id: 'week-streak',
    name: 'Dedicated Learner',
    description: 'Maintain a 7-day learning streak',
    badgeUrl: '/badges/week-streak.svg',
    unlockedDate: new Date(),
    category: 'streak'
  },
  {
    id: 'module-complete',
    name: 'Module Master',
    description: 'Complete your first module',
    badgeUrl: '/badges/module-complete.svg',
    unlockedDate: new Date(),
    category: 'learning'
  },
  {
    id: 'practical-expert',
    name: 'Hands-On Expert',
    description: 'Complete 10 practical exercises',
    badgeUrl: '/badges/practical-expert.svg',
    unlockedDate: new Date(),
    category: 'practical'
  }
];

// Market-Adaptive Content Recommendations
export const getRecommendedModules = (marketCondition: string): string[] => {
  const recommendations: Record<string, string[]> = {
    'high-volatility': ['technical-analysis-101', 'risk-management-pro'],
    'bear-market': ['risk-management-pro', 'fundamentals-101'],
    'bull-market': ['fundamentals-101', 'technical-analysis-101'],
    'earnings-season': ['fundamental-analysis-101', 'technical-analysis-101'],
    'market-crash': ['risk-management-pro', 'behavioral-finance-101']
  };
  
  return recommendations[marketCondition] || ['fundamentals-101'];
};

// Difficulty Assessment Questions
export const assessmentQuestions = [
  {
    id: 'exp-level',
    question: 'How would you describe your investing experience?',
    options: [
      'Complete beginner - never invested before',
      'Some experience - have made a few trades',
      'Intermediate - actively trade/invest regularly',
      'Advanced - professional or extensive experience'
    ],
    weights: [0, 25, 50, 75]
  },
  {
    id: 'risk-tolerance',
    question: 'What is your risk tolerance?',
    options: [
      'Very conservative - prefer guaranteed returns',
      'Somewhat conservative - small losses acceptable',
      'Moderate - willing to accept volatility for growth',
      'Aggressive - comfortable with high risk/reward'
    ],
    weights: [0, 20, 40, 60]
  },
  {
    id: 'time-commitment',
    question: 'How much time can you dedicate to learning per week?',
    options: [
      'Less than 2 hours',
      '2-5 hours',
      '5-10 hours',
      'More than 10 hours'
    ],
    weights: [10, 25, 40, 50]
  }
];