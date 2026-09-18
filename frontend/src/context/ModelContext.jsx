import React, { createContext, useContext, useState, useEffect } from 'react';

const ModelContext = createContext(null);

export const AVAILABLE_MODELS = [
  {
    id: 'Baseline (Ridge Regression)',
    name: 'Baseline (Ridge Regression)',
    shortName: 'Ridge Regression',
    architecture: 'L2-Regularized Linear Model',
    description: 'High interpretability, optimal generalizability on atmospheric trends with minimal overfitting.',
    badge: 'Benchmark Champion'
  },
  {
    id: 'Gradient Boosting Regressor',
    name: 'Gradient Boosting Regressor',
    shortName: 'Gradient Tree Boosting',
    architecture: 'Histogram-based Gradient Boosting (LightGBM-style)',
    description: 'Captures non-linear atmospheric interactions between humidity, wind, and photochemical ozone.',
    badge: 'High Non-Linearity'
  },
  {
    id: 'Random Forest Regressor',
    name: 'Random Forest Regressor',
    shortName: 'Random Forest Ensemble',
    architecture: 'Bagged Decision Trees Ensemble (150 Estimators)',
    description: 'Robust against isolated particulate measurement spikes and extreme weather anomalies.',
    badge: 'Ensemble Robustness'
  }
];

export function ModelProvider({ children }) {
  const [activeModel, setActiveModel] = useState(() => {
    try {
      const stored = localStorage.getItem('airguard_active_model');
      return stored || 'Baseline (Ridge Regression)';
    } catch {
      return 'Baseline (Ridge Regression)';
    }
  });

  const selectModel = (modelName) => {
    setActiveModel(modelName);
    try {
      localStorage.setItem('airguard_active_model', modelName);
    } catch (e) {
      console.warn('Could not save model to localStorage:', e);
    }
  };

  const getModelDetails = (name) => {
    return AVAILABLE_MODELS.find((m) => m.name === name || m.id === name) || AVAILABLE_MODELS[0];
  };

  return (
    <ModelContext.Provider
      value={{
        activeModel,
        setActiveModel: selectModel,
        availableModels: AVAILABLE_MODELS,
        activeModelDetails: getModelDetails(activeModel),
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
}
