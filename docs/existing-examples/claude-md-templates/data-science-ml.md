# [Project Name] - Data Science & Machine Learning Project

An end-to-end data science and machine learning project designed for reproducible research, scalable model development, and production deployment of ML solutions.

## Project Overview

This project implements a comprehensive data science workflow including data exploration, feature engineering, model development, validation, and deployment. Built with industry best practices for reproducibility, collaboration, and model lifecycle management.

**Primary Goals:**
- Deliver accurate and reliable ML models for production use
- Ensure reproducible research and experimentation workflows
- Maintain data quality and governance throughout the pipeline
- Enable collaborative data science with version control and documentation

## Tech Stack

### Data Science Stack
- **Language**: Python 3.9+ with conda/poetry environment management
- **Compute**: Jupyter Lab / VS Code with Python extension
- **Notebooks**: Jupyter notebooks with nbstripout for version control
- **Data Manipulation**: pandas, NumPy, Polars for large datasets

### Machine Learning
- **ML Frameworks**: scikit-learn, XGBoost, LightGBM, CatBoost
- **Deep Learning**: PyTorch / TensorFlow 2.x with GPU support
- **Model Validation**: scikit-learn metrics, MLflow for experiment tracking
- **Feature Engineering**: feature-engine, category_encoders, scikit-learn pipelines

### Data Infrastructure
- **Data Storage**: PostgreSQL / MongoDB / Parquet files / Data Lake (S3/Azure)
- **Data Processing**: Apache Spark (PySpark) / Dask for distributed computing
- **Data Validation**: Great Expectations for data quality checks
- **Feature Store**: Feast / Tecton for feature management

### MLOps & Deployment
- **Experiment Tracking**: MLflow / Weights & Biases / Neptune
- **Model Registry**: MLflow Model Registry / DVC
- **Model Serving**: FastAPI / Flask for REST APIs, Streamlit for demos
- **Monitoring**: Evidently AI / Whylogs for model drift detection
- **Container**: Docker with CUDA support for GPU workloads

### Development & Collaboration
- **Code Quality**: Black (formatting), isort, flake8, mypy (type checking)
- **Testing**: pytest with coverage reporting
- **Documentation**: Sphinx for API docs, Jupyter Book for analysis reports
- **Version Control**: Git with DVC for data and model versioning

## Project Structure

```
├── data/
│   ├── raw/                # Original, immutable data
│   ├── interim/           # Intermediate data transformations
│   ├── processed/         # Final, analysis-ready datasets
│   └── external/          # External reference data
├── notebooks/
│   ├── exploratory/       # Initial data exploration
│   ├── modeling/          # Model development and experimentation
│   └── reports/           # Final analysis and presentation notebooks
├── src/
│   ├── data/              # Data ingestion and processing
│   ├── features/          # Feature engineering pipelines
│   ├── models/            # Model training and prediction
│   ├── evaluation/        # Model evaluation and validation
│   └── visualization/     # Data visualization utilities
├── models/                # Trained model artifacts
├── reports/
│   ├── figures/           # Generated graphics and figures
│   └── final/             # Final reports and presentations
├── tests/
│   ├── unit/              # Unit tests for src modules
│   ├── integration/       # Integration tests for pipelines
│   └── data/              # Data validation tests
├── config/                # Configuration files for different environments
├── scripts/               # Utility scripts for automation
└── docs/                  # Project documentation and methodology
```

## Development Guidelines

### Data Science Methodology
- **CRISP-DM Process**: Follow Cross-Industry Standard Process for Data Mining
- **Reproducible Research**: All analysis must be reproducible with version-controlled data
- **Data Quality**: Implement comprehensive data validation and testing
- **Feature Documentation**: Maintain clear documentation of all features and transformations
- **Model Interpretability**: Prioritize explainable models and feature importance analysis

### Code Quality Standards
- **Modular Code**: Separate data processing, feature engineering, and modeling code
- **Function-First**: Write functions for all data transformations and model operations
- **Type Hints**: Use type hints for all function definitions
- **Documentation**: Comprehensive docstrings with examples for all functions
- **Testing**: Unit tests for all data processing and modeling functions

### Data Management Principles
- **Data Immutability**: Never modify raw data; always create new processed versions
- **Data Lineage**: Track data transformations and feature engineering steps
- **Data Validation**: Validate data quality at each pipeline stage
- **Version Control**: Use DVC for data and model versioning
- **Data Privacy**: Implement data anonymization and privacy protection measures

### Model Development Process
- **Baseline Models**: Always establish simple baseline models first
- **Cross-Validation**: Use appropriate validation strategies for time series/grouped data
- **Feature Selection**: Systematic feature selection with statistical validation
- **Hyperparameter Tuning**: Structured hyperparameter optimization with MLflow tracking
- **Model Comparison**: Compare multiple algorithms with statistical significance testing

## Key Commands

### Environment Management
- `conda env create -f environment.yml` - Create conda environment
- `conda env update -f environment.yml` - Update environment with new packages
- `poetry install` - Install Python dependencies with Poetry
- `poetry add package-name` - Add new package dependency

### Data Processing
- `python src/data/make_dataset.py` - Process raw data into analysis-ready format
- `python src/features/build_features.py` - Run feature engineering pipeline
- `dvc repro` - Reproduce entire data pipeline with DVC
- `great_expectations suite run` - Validate data quality

### Model Development
- `python src/models/train_model.py --config config/experiment.yaml` - Train model
- `python src/models/predict_model.py --model models/best_model.pkl` - Generate predictions
- `mlflow ui` - Start MLflow tracking server
- `python src/evaluation/evaluate_model.py` - Run model evaluation

### Jupyter Notebook Management
- `jupyter lab` - Start Jupyter Lab server
- `nbstripout --install` - Install git hook to clean notebook outputs
- `jupyter nbconvert --to html notebook.ipynb` - Convert notebook to HTML
- `papermill input.ipynb output.ipynb -p param value` - Parameterized notebook execution

### Testing and Quality
- `pytest tests/` - Run all tests
- `pytest tests/ --cov=src` - Run tests with coverage report
- `black src/ tests/` - Format code with Black
- `flake8 src/ tests/` - Lint code for style issues
- `mypy src/` - Type check with mypy

## Data Pipeline Architecture

### Data Ingestion
```python
# Example data ingestion function
def load_raw_data(source: str, date_range: tuple = None) -> pd.DataFrame:
    """
    Load raw data from specified source with optional date filtering.

    Parameters:
        source: Data source identifier ('database', 'api', 'file')
        date_range: Tuple of (start_date, end_date) for filtering

    Returns:
        Raw dataset as pandas DataFrame
    """
    # Implementation with proper error handling and logging
    pass

def validate_raw_data(df: pd.DataFrame) -> bool:
    """Validate raw data meets expected schema and quality standards."""
    # Great Expectations validation suite
    pass
```

### Feature Engineering
```python
from sklearn.base import BaseEstimator, TransformerMixin

class CustomFeatureTransformer(BaseEstimator, TransformerMixin):
    """Custom transformer for domain-specific feature engineering."""

    def __init__(self, feature_config: dict):
        self.feature_config = feature_config

    def fit(self, X: pd.DataFrame, y: pd.Series = None):
        # Learn parameters from training data
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        # Apply transformations
        return X_transformed
```

### Model Training Pipeline
```python
def train_model(config: dict) -> tuple:
    """
    Train ML model with specified configuration.

    Returns:
        Tuple of (trained_model, metrics, feature_importance)
    """
    # Load and validate data
    X_train, X_val, y_train, y_val = load_and_split_data(config)

    # Initialize model with hyperparameters
    model = initialize_model(config['model_params'])

    # Train with MLflow tracking
    with mlflow.start_run():
        model.fit(X_train, y_train)
        predictions = model.predict(X_val)
        metrics = calculate_metrics(y_val, predictions)

        # Log parameters, metrics, and model
        mlflow.log_params(config['model_params'])
        mlflow.log_metrics(metrics)
        mlflow.sklearn.log_model(model, "model")

    return model, metrics, model.feature_importances_
```

## Model Evaluation Framework

### Performance Metrics
- **Classification**: Accuracy, Precision, Recall, F1-Score, AUC-ROC, AUC-PR
- **Regression**: MAE, RMSE, R², MAPE, residual analysis
- **Business Metrics**: Custom metrics aligned with business objectives
- **Fairness Metrics**: Bias detection across demographic groups

### Validation Strategy
```python
def cross_validate_model(model, X, y, cv_strategy='time_series'):
    """
    Perform cross-validation with appropriate strategy for data type.
    """
    if cv_strategy == 'time_series':
        cv = TimeSeriesSplit(n_splits=5)
    elif cv_strategy == 'grouped':
        cv = GroupKFold(n_splits=5)
    else:
        cv = StratifiedKFold(n_splits=5)

    scores = cross_val_score(model, X, y, cv=cv, scoring='f1_weighted')
    return scores.mean(), scores.std()
```

### Model Interpretability
```python
import shap
import lime

def explain_predictions(model, X_test, instance_idx=None):
    """
    Generate model explanations using SHAP and LIME.
    """
    # SHAP explanations for global interpretability
    explainer = shap.Explainer(model)
    shap_values = explainer(X_test)

    # LIME explanation for specific instance
    if instance_idx is not None:
        lime_explainer = lime.tabular.LimeTabularExplainer(
            X_test.values, feature_names=X_test.columns
        )
        lime_exp = lime_explainer.explain_instance(
            X_test.iloc[instance_idx].values, model.predict_proba
        )
        return shap_values, lime_exp

    return shap_values
```

## Environment Configuration

### Conda Environment
```yaml
# environment.yml
name: ml-project
channels:
  - conda-forge
  - defaults
dependencies:
  - python=3.9
  - numpy=1.21.*
  - pandas=1.3.*
  - scikit-learn=1.0.*
  - jupyter=1.0.*
  - matplotlib=3.4.*
  - seaborn=0.11.*
  - pip
  - pip:
    - mlflow==1.20.*
    - great-expectations==0.13.*
    - evidently==0.1.*
```

### Configuration Files
```python
# config/config.py
from dataclasses import dataclass
from typing import Dict, Any

@dataclass
class ModelConfig:
    model_type: str = "xgboost"
    model_params: Dict[str, Any] = None
    validation_strategy: str = "time_series"
    test_size: float = 0.2
    random_state: int = 42

@dataclass
class DataConfig:
    data_source: str = "database"
    target_column: str = "target"
    feature_columns: list = None
    date_column: str = "date"
    categorical_columns: list = None
```

## Experiment Tracking

### MLflow Integration
```python
import mlflow
import mlflow.sklearn

# Start experiment tracking
mlflow.set_experiment("model-development")

with mlflow.start_run():
    # Log parameters
    mlflow.log_param("model_type", "XGBoost")
    mlflow.log_param("n_estimators", 100)

    # Log metrics
    mlflow.log_metric("accuracy", 0.85)
    mlflow.log_metric("f1_score", 0.83)

    # Log model artifacts
    mlflow.sklearn.log_model(model, "model")

    # Log custom artifacts
    mlflow.log_artifact("reports/confusion_matrix.png")
```

### Experiment Organization
- **Experiment Naming**: Use descriptive names with version numbers
- **Run Tags**: Tag runs with feature sets, data versions, and objectives
- **Parameter Logging**: Log all hyperparameters and configuration settings
- **Metric Tracking**: Track both technical and business metrics
- **Artifact Management**: Store model files, plots, and reports

## Data Quality & Validation

### Great Expectations Setup
```python
# src/data/validation.py
import great_expectations as ge

def create_data_expectation_suite(df: pd.DataFrame) -> dict:
    """
    Create data validation suite using Great Expectations.
    """
    # Convert to GE DataFrame
    ge_df = ge.from_pandas(df)

    # Define expectations
    ge_df.expect_table_row_count_to_be_between(min_value=1000, max_value=100000)
    ge_df.expect_column_values_to_not_be_null("target")
    ge_df.expect_column_values_to_be_between("age", min_value=0, max_value=120)
    ge_df.expect_column_values_to_be_in_set("category", ["A", "B", "C"])

    # Save expectation suite
    return ge_df.get_expectation_suite()
```

### Data Drift Detection
```python
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset

def detect_data_drift(reference_data, current_data, target='target'):
    """
    Detect data drift between reference and current datasets.
    """
    column_mapping = ColumnMapping(target=target)

    report = Report(metrics=[DataDriftPreset()])
    report.run(reference_data=reference_data,
               current_data=current_data,
               column_mapping=column_mapping)

    return report
```

## Model Deployment

### API Service with FastAPI
```python
# src/api/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import pandas as pd

app = FastAPI(title="ML Model API", version="1.0.0")

# Load model on startup
model = joblib.load("models/production_model.pkl")

class PredictionRequest(BaseModel):
    features: dict

class PredictionResponse(BaseModel):
    prediction: float
    probability: float
    confidence: str

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        # Convert features to DataFrame
        features_df = pd.DataFrame([request.features])

        # Generate prediction
        prediction = model.predict(features_df)[0]
        probability = model.predict_proba(features_df)[0].max()

        # Determine confidence level
        confidence = "high" if probability > 0.8 else "medium" if probability > 0.6 else "low"

        return PredictionResponse(
            prediction=prediction,
            probability=probability,
            confidence=confidence
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_version": "1.0.0"}
```

### Model Monitoring
```python
def monitor_model_performance(predictions, actuals, threshold=0.05):
    """
    Monitor model performance degradation over time.
    """
    from scipy import stats

    # Calculate current performance
    current_accuracy = accuracy_score(actuals, predictions)

    # Compare with baseline (stored from training)
    baseline_accuracy = load_baseline_metrics()['accuracy']

    # Statistical test for significant degradation
    _, p_value = stats.ttest_1samp(predictions == actuals, baseline_accuracy)

    if p_value < threshold:
        alert_model_degradation(current_accuracy, baseline_accuracy)

    # Log metrics for tracking
    log_performance_metrics(current_accuracy, timestamp=datetime.now())
```

## Testing Strategy

### Unit Tests
```python
# tests/unit/test_features.py
import pytest
import pandas as pd
from src.features.build_features import CustomFeatureTransformer

class TestFeatureTransformer:
    def setup_method(self):
        self.sample_data = pd.DataFrame({
            'numeric_col': [1, 2, 3, 4, 5],
            'categorical_col': ['A', 'B', 'A', 'C', 'B']
        })

    def test_transformer_fit_transform(self):
        transformer = CustomFeatureTransformer()
        result = transformer.fit_transform(self.sample_data)

        assert isinstance(result, pd.DataFrame)
        assert result.shape[0] == self.sample_data.shape[0]

    def test_transformer_handles_missing_values(self):
        data_with_missing = self.sample_data.copy()
        data_with_missing.loc[0, 'numeric_col'] = None

        transformer = CustomFeatureTransformer()
        result = transformer.fit_transform(data_with_missing)

        assert result.isnull().sum().sum() == 0
```

### Integration Tests
```python
# tests/integration/test_pipeline.py
def test_end_to_end_pipeline():
    """Test complete pipeline from data loading to model prediction."""
    # Load test data
    test_data = load_test_dataset()

    # Run data processing
    processed_data = run_data_pipeline(test_data)

    # Train model
    model = train_model(processed_data)

    # Generate predictions
    predictions = model.predict(processed_data.drop('target', axis=1))

    # Validate predictions
    assert len(predictions) == len(processed_data)
    assert all(pred in [0, 1] for pred in predictions)  # Binary classification
```

## Security & Compliance

### Data Privacy
- **Data Anonymization**: Remove or hash personally identifiable information
- **Access Control**: Implement role-based access to sensitive datasets
- **Data Retention**: Establish data retention policies and automated cleanup
- **Audit Logging**: Log all data access and model predictions for compliance

### Model Security
- **Input Validation**: Sanitize all input data for prediction APIs
- **Model Versioning**: Maintain secure model registry with access controls
- **Adversarial Testing**: Test model robustness against adversarial examples
- **Dependency Scanning**: Regular security scans of Python packages

## Development Workflow

### Research Phase
1. **Data Exploration**: Comprehensive EDA with documented insights
2. **Problem Definition**: Clear definition of ML problem and success metrics
3. **Literature Review**: Research existing solutions and benchmarks
4. **Data Quality Assessment**: Validate data quality and completeness

### Development Phase
1. **Feature Engineering**: Systematic feature creation and selection
2. **Model Development**: Iterative model development with experiment tracking
3. **Model Validation**: Rigorous validation using appropriate methods
4. **Performance Optimization**: Hyperparameter tuning and model optimization

### Deployment Phase
1. **Model Review**: Peer review of model logic and performance
2. **Integration Testing**: Test model integration with production systems
3. **Gradual Rollout**: Staged deployment with monitoring
4. **Performance Monitoring**: Continuous monitoring of model performance

## Claude Code Integration Notes

When working with this data science project, focus on:
- **Reproducibility**: Ensure all analysis and model training can be reproduced
- **Data Quality**: Maintain high data quality standards throughout the pipeline
- **Documentation**: Keep comprehensive documentation of methodologies and decisions
- **Performance Monitoring**: Implement robust monitoring for production models
- **Ethical AI**: Consider bias, fairness, and interpretability in all model development

For data analysis tasks, prioritize statistical rigor and clear visualization of insights. For model development, focus on proper validation techniques and comprehensive evaluation metrics.