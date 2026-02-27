import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { jest } from '@jest/globals';
import QualificationGate from '../QualificationGate';
import { QualificationStatus } from '@/lib/types/paper-trading';

// Mock the fetch function
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock the learning system functions
jest.mock('@/lib/learningSystem', () => ({
  calculateQualificationProgress: jest.fn(() => ({
    moduleProgress: 75,
    simulationProgress: 60,
    overallProgress: 67
  })),
  getNextQualificationAction: jest.fn(() => 'Complete technical-analysis-intro module')
}));

const mockQualifiedStatus: QualificationStatus = {
  isQualified: true,
  completedModules: ['fundamentals-basics', 'risk-management-essentials', 'technical-analysis-intro'],
  requiredModules: ['fundamentals-basics', 'risk-management-essentials', 'technical-analysis-intro'],
  quizScores: {
    'fundamentals-basics': 85,
    'risk-management-essentials': 78,
    'technical-analysis-intro': 92
  },
  simulationCount: 5,
  qualificationDate: new Date('2024-01-15'),
  totalScore: 255,
  missingRequirements: []
};

const mockUnqualifiedStatus: QualificationStatus = {
  isQualified: false,
  completedModules: ['fundamentals-basics', 'risk-management-essentials'],
  requiredModules: ['fundamentals-basics', 'risk-management-essentials', 'technical-analysis-intro', 'market-psychology-basics'],
  quizScores: {
    'fundamentals-basics': 85,
    'risk-management-essentials': 78
  },
  simulationCount: 3,
  totalScore: 163,
  missingRequirements: ['Complete technical-analysis-intro module', 'Complete market-psychology-basics module', 'Complete 2 more simulations']
};

describe('QualificationGate', () => {
  const mockOnNavigateToModule = jest.fn();
  const mockOnNavigateToSimulation = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockClear();
  });

  it('shows loading state initially', () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <QualificationGate userId="test-user">
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    expect(screen.getByText('Checking qualification status...')).toBeInTheDocument();
  });

  it('renders children when user is qualified', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockQualifiedStatus })
    } as Response);

    render(
      <QualificationGate userId="test-user">
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Paper Trading Interface')).toBeInTheDocument();
    });
  });

  it('shows qualification progress when user is not qualified', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockUnqualifiedStatus })
    } as Response);

    render(
      <QualificationGate 
        userId="test-user"
        onNavigateToModule={mockOnNavigateToModule}
        onNavigateToSimulation={mockOnNavigateToSimulation}
      >
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Paper Trading Qualification')).toBeInTheDocument();
      expect(screen.getByText('Complete the requirements below to unlock paper trading')).toBeInTheDocument();
    });
  });

  it('displays correct module completion status', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockUnqualifiedStatus })
    } as Response);

    render(
      <QualificationGate 
        userId="test-user"
        onNavigateToModule={mockOnNavigateToModule}
      >
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      // Should show completed modules
      expect(screen.getByText('Fundamentals basics')).toBeInTheDocument();
      expect(screen.getByText('Risk management essentials')).toBeInTheDocument();
      
      // Should show incomplete modules
      expect(screen.getByText('Technical analysis intro')).toBeInTheDocument();
      expect(screen.getByText('Market psychology basics')).toBeInTheDocument();
    });
  });

  it('displays simulation progress correctly', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockUnqualifiedStatus })
    } as Response);

    render(
      <QualificationGate 
        userId="test-user"
        onNavigateToSimulation={mockOnNavigateToSimulation}
      >
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(screen.getByText('3 of 5 completed')).toBeInTheDocument();
      expect(screen.getByText('Start Next Simulation')).toBeInTheDocument();
    });
  });

  it('calls navigation handlers when clicking on incomplete modules', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockUnqualifiedStatus })
    } as Response);

    render(
      <QualificationGate 
        userId="test-user"
        onNavigateToModule={mockOnNavigateToModule}
      >
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      const incompleteModule = screen.getByText('Technical analysis intro').closest('div');
      if (incompleteModule) {
        fireEvent.click(incompleteModule);
        expect(mockOnNavigateToModule).toHaveBeenCalledWith('technical-analysis-intro');
      }
    });
  });

  it('calls simulation handler when clicking simulation button', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockUnqualifiedStatus })
    } as Response);

    render(
      <QualificationGate 
        userId="test-user"
        onNavigateToSimulation={mockOnNavigateToSimulation}
      >
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      const simulationButton = screen.getByText('Start Next Simulation');
      fireEvent.click(simulationButton);
      expect(mockOnNavigateToSimulation).toHaveBeenCalled();
    });
  });

  it('shows error state when API call fails', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
      new Error('Network error')
    );

    render(
      <QualificationGate userId="test-user">
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to Load')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows retry button in error state and retries on click', async () => {
    (fetch as jest.MockedFunction<typeof fetch>)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ qualificationStatus: mockQualifiedStatus })
      } as Response);

    render(
      <QualificationGate userId="test-user">
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Paper Trading Interface')).toBeInTheDocument();
    });
  });

  it('displays missing requirements when present', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockUnqualifiedStatus })
    } as Response);

    render(
      <QualificationGate userId="test-user">
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(screen.getByText('Missing Requirements')).toBeInTheDocument();
      expect(screen.getByText('Complete technical-analysis-intro module')).toBeInTheDocument();
      expect(screen.getByText('Complete market-psychology-basics module')).toBeInTheDocument();
      expect(screen.getByText('Complete 2 more simulations')).toBeInTheDocument();
    });
  });

  it('makes API call with correct userId', async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ qualificationStatus: mockQualifiedStatus })
    } as Response);

    render(
      <QualificationGate userId="test-user-123">
        <div>Paper Trading Interface</div>
      </QualificationGate>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/learning/qualification-status?userId=test-user-123');
    });
  });
});