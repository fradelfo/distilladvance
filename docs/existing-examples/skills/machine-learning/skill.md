# Machine Learning Skill

Modern machine learning and AI development capabilities covering model development, MLOps pipelines, deployment strategies, and production monitoring.

## Skill Overview

Expert machine learning knowledge including model development with PyTorch/TensorFlow, MLOps workflows, model deployment, monitoring, and AI system architecture using cutting-edge tools and frameworks.

## Core Capabilities

### Model Development
- **Deep learning** - Neural networks, transformers, CNNs, RNNs with PyTorch/TensorFlow
- **Classical ML** - Scikit-learn, XGBoost, LightGBM for structured data
- **Computer vision** - Object detection, segmentation, OCR with modern architectures
- **NLP/LLMs** - Fine-tuning, RAG systems, prompt engineering, embeddings

### MLOps & Lifecycle Management
- **Experiment tracking** - MLflow, Weights & Biases, Neptune integration
- **Model versioning** - DVC, Git LFS, model registries
- **Pipeline automation** - Kubeflow, MLflow, Apache Airflow workflows
- **Continuous training** - Automated retraining, drift detection

### Model Deployment
- **Serving platforms** - TensorFlow Serving, TorchServe, Triton Inference Server
- **API development** - FastAPI, Flask endpoints with proper scaling
- **Edge deployment** - ONNX, TensorFlow Lite, model quantization
- **Batch processing** - Spark MLlib, distributed inference

### Production Monitoring
- **Model performance** - Drift detection, data quality monitoring
- **Infrastructure monitoring** - GPU utilization, latency, throughput
- **Business metrics** - A/B testing, ROI tracking, impact analysis
- **Alerting systems** - Automated anomaly detection and notifications

## Modern ML Development Stack

### PyTorch Training Pipeline
```python
# Modern PyTorch training with advanced features
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torch.cuda.amp import GradScaler, autocast
import pytorch_lightning as pl
from pytorch_lightning.callbacks import ModelCheckpoint, EarlyStopping
from pytorch_lightning.loggers import WandbLogger
import wandb
from torchmetrics import Accuracy, F1Score
import hydra
from omegaconf import DictConfig
from typing import Dict, Any, Tuple
import mlflow

class ModernTransformer(pl.LightningModule):
    def __init__(self, config: DictConfig):
        super().__init__()
        self.save_hyperparameters()
        self.config = config

        # Model architecture
        self.embedding = nn.Embedding(
            config.vocab_size,
            config.hidden_dim,
            padding_idx=0
        )

        self.transformer = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(
                d_model=config.hidden_dim,
                nhead=config.num_heads,
                dim_feedforward=config.ff_dim,
                dropout=config.dropout,
                activation='gelu',
                batch_first=True
            ),
            num_layers=config.num_layers
        )

        self.classifier = nn.Sequential(
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim, config.hidden_dim // 2),
            nn.GELU(),
            nn.Dropout(config.dropout),
            nn.Linear(config.hidden_dim // 2, config.num_classes)
        )

        # Metrics
        self.train_acc = Accuracy(task='multiclass', num_classes=config.num_classes)
        self.val_acc = Accuracy(task='multiclass', num_classes=config.num_classes)
        self.val_f1 = F1Score(task='multiclass', num_classes=config.num_classes)

        # Loss function with label smoothing
        self.criterion = nn.CrossEntropyLoss(
            label_smoothing=config.label_smoothing
        )

    def forward(self, input_ids: torch.Tensor, attention_mask: torch.Tensor = None):
        # Create attention mask if not provided
        if attention_mask is None:
            attention_mask = (input_ids != 0).float()

        # Embedding with positional encoding
        embedded = self.embedding(input_ids)

        # Apply transformer
        transformer_output = self.transformer(
            embedded,
            src_key_padding_mask=~attention_mask.bool()
        )

        # Global average pooling
        pooled = (transformer_output * attention_mask.unsqueeze(-1)).sum(dim=1) / attention_mask.sum(dim=1, keepdim=True)

        # Classification
        logits = self.classifier(pooled)

        return logits

    def training_step(self, batch: Dict[str, torch.Tensor], batch_idx: int):
        input_ids = batch['input_ids']
        labels = batch['labels']
        attention_mask = batch.get('attention_mask')

        # Forward pass with mixed precision
        with autocast():
            logits = self(input_ids, attention_mask)
            loss = self.criterion(logits, labels)

        # Metrics
        preds = torch.argmax(logits, dim=-1)
        acc = self.train_acc(preds, labels)

        # Logging
        self.log('train_loss', loss, on_step=True, on_epoch=True, prog_bar=True)
        self.log('train_acc', acc, on_step=True, on_epoch=True, prog_bar=True)

        return loss

    def validation_step(self, batch: Dict[str, torch.Tensor], batch_idx: int):
        input_ids = batch['input_ids']
        labels = batch['labels']
        attention_mask = batch.get('attention_mask')

        with autocast():
            logits = self(input_ids, attention_mask)
            loss = self.criterion(logits, labels)

        preds = torch.argmax(logits, dim=-1)
        acc = self.val_acc(preds, labels)
        f1 = self.val_f1(preds, labels)

        self.log('val_loss', loss, on_epoch=True, prog_bar=True)
        self.log('val_acc', acc, on_epoch=True, prog_bar=True)
        self.log('val_f1', f1, on_epoch=True, prog_bar=True)

        return loss

    def configure_optimizers(self):
        # AdamW optimizer with weight decay
        optimizer = optim.AdamW(
            self.parameters(),
            lr=self.config.learning_rate,
            weight_decay=self.config.weight_decay,
            betas=(0.9, 0.999),
            eps=1e-8
        )

        # Cosine annealing scheduler with warmup
        total_steps = self.trainer.estimated_stepping_batches
        warmup_steps = int(0.1 * total_steps)

        scheduler = optim.lr_scheduler.OneCycleLR(
            optimizer,
            max_lr=self.config.learning_rate,
            total_steps=total_steps,
            pct_start=warmup_steps / total_steps,
            anneal_strategy='cos'
        )

        return {
            'optimizer': optimizer,
            'lr_scheduler': {
                'scheduler': scheduler,
                'interval': 'step',
                'frequency': 1
            }
        }

# Advanced training script with MLflow integration
@hydra.main(config_path="config", config_name="train")
def train_model(config: DictConfig):
    # Set random seeds for reproducibility
    pl.seed_everything(config.seed, workers=True)

    # Initialize MLflow
    mlflow.set_tracking_uri(config.mlflow_uri)
    mlflow.set_experiment(config.experiment_name)

    with mlflow.start_run(run_name=config.run_name):
        # Log configuration
        mlflow.log_params(dict(config))

        # Initialize logger
        wandb_logger = WandbLogger(
            project=config.wandb_project,
            name=config.run_name,
            config=dict(config)
        )

        # Data loaders
        train_loader = create_data_loader(config, split='train')
        val_loader = create_data_loader(config, split='val')

        # Model
        model = ModernTransformer(config)

        # Callbacks
        checkpoint_callback = ModelCheckpoint(
            dirpath=config.checkpoint_dir,
            filename='{epoch}-{val_acc:.3f}',
            monitor='val_acc',
            mode='max',
            save_top_k=3,
            save_last=True
        )

        early_stopping = EarlyStopping(
            monitor='val_loss',
            patience=config.patience,
            mode='min',
            strict=True
        )

        # Trainer with advanced features
        trainer = pl.Trainer(
            max_epochs=config.max_epochs,
            gpus=config.gpus if torch.cuda.is_available() else 0,
            precision=16 if config.mixed_precision else 32,
            gradient_clip_val=config.gradient_clip_val,
            accumulate_grad_batches=config.accumulate_grad_batches,
            callbacks=[checkpoint_callback, early_stopping],
            logger=wandb_logger,
            val_check_interval=config.val_check_interval,
            log_every_n_steps=config.log_every_n_steps,
            deterministic=True,
            strategy='ddp' if config.gpus > 1 else None
        )

        # Training
        trainer.fit(model, train_loader, val_loader)

        # Log best model to MLflow
        best_model_path = checkpoint_callback.best_model_path
        mlflow.pytorch.log_model(
            pytorch_model=model,
            artifact_path="model",
            registered_model_name=config.model_name
        )

        # Log metrics
        mlflow.log_metrics({
            'best_val_acc': checkpoint_callback.best_model_score.item(),
            'total_parameters': sum(p.numel() for p in model.parameters())
        })

if __name__ == "__main__":
    train_model()

# Model serving with FastAPI
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
import asyncio
from typing import List, Dict
import uvicorn

class PredictionRequest(BaseModel):
    texts: List[str]
    max_length: int = 512

class PredictionResponse(BaseModel):
    predictions: List[Dict[str, float]]
    inference_time: float

class ModelServer:
    def __init__(self, model_path: str, device: str = "cuda"):
        self.device = torch.device(device if torch.cuda.is_available() else "cpu")
        self.model = self.load_model(model_path)
        self.tokenizer = self.load_tokenizer()

    def load_model(self, model_path: str):
        """Load model with optimizations"""
        model = torch.load(model_path, map_location=self.device)
        model.eval()

        # Apply optimizations
        if hasattr(torch, 'compile'):  # PyTorch 2.0+
            model = torch.compile(model)

        return model

    async def predict(self, texts: List[str], max_length: int = 512) -> List[Dict[str, float]]:
        """Async inference with batching"""
        start_time = asyncio.get_event_loop().time()

        # Tokenization
        inputs = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=max_length,
            return_tensors="pt"
        ).to(self.device)

        # Inference
        with torch.no_grad():
            with autocast():
                logits = self.model(**inputs)
                probabilities = torch.softmax(logits, dim=-1)

        # Convert to response format
        predictions = []
        for i, probs in enumerate(probabilities):
            prediction = {
                f"class_{j}": float(prob)
                for j, prob in enumerate(probs)
            }
            predictions.append(prediction)

        inference_time = asyncio.get_event_loop().time() - start_time

        return predictions, inference_time

# Initialize FastAPI app
app = FastAPI(title="ML Model API", version="1.0.0")
model_server = ModelServer("path/to/model.pth")

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        predictions, inference_time = await model_server.predict(
            request.texts,
            request.max_length
        )

        return PredictionResponse(
            predictions=predictions,
            inference_time=inference_time
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "device": str(model_server.device)}
```

### MLOps Pipeline with Kubeflow
```python
# Kubeflow pipeline for end-to-end ML workflow
from kfp import dsl, components
from kfp.v2 import compiler
from kfp.v2.dsl import (
    component, pipeline, Artifact, ClassificationMetrics,
    Input, Output, Model, Dataset, Metrics
)
import pandas as pd

@component(
    base_image="python:3.9",
    packages_to_install=["pandas", "scikit-learn", "mlflow"]
)
def data_preprocessing(
    raw_data: Input[Dataset],
    processed_data: Output[Dataset],
    train_split: float = 0.8
) -> dict:
    """Data preprocessing component"""
    import pandas as pd
    import json
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler, LabelEncoder

    # Load data
    df = pd.read_csv(raw_data.path)

    # Data cleaning
    df = df.dropna()
    df = df.drop_duplicates()

    # Feature engineering
    # (Add domain-specific feature engineering here)

    # Encode categorical variables
    label_encoders = {}
    for col in df.select_dtypes(include=['object']).columns:
        if col != 'target':
            le = LabelEncoder()
            df[col] = le.fit_transform(df[col])
            label_encoders[col] = le.classes_.tolist()

    # Split features and target
    X = df.drop('target', axis=1)
    y = df['target']

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=1-train_split, random_state=42, stratify=y
    )

    # Feature scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save processed data
    processed_df = pd.DataFrame(X_train_scaled, columns=X.columns)
    processed_df['target'] = y_train.values
    processed_df.to_csv(processed_data.path, index=False)

    # Return metadata
    return {
        "num_samples": len(df),
        "num_features": len(X.columns),
        "num_classes": len(y.unique()),
        "train_size": len(X_train),
        "test_size": len(X_test)
    }

@component(
    base_image="pytorch/pytorch:1.13-cuda11.6-cudnn8-devel",
    packages_to_install=["mlflow", "scikit-learn", "pytorch-lightning"]
)
def model_training(
    training_data: Input[Dataset],
    model_artifact: Output[Model],
    training_metrics: Output[Metrics],
    learning_rate: float = 0.001,
    batch_size: int = 32,
    max_epochs: int = 100
) -> dict:
    """Model training component"""
    import torch
    import torch.nn as nn
    import pytorch_lightning as pl
    from torch.utils.data import DataLoader, TensorDataset
    import pandas as pd
    import mlflow
    import json

    # Load and prepare data
    df = pd.read_csv(training_data.path)
    X = df.drop('target', axis=1).values
    y = df['target'].values

    # Convert to tensors
    X_tensor = torch.FloatTensor(X)
    y_tensor = torch.LongTensor(y)

    # Create dataset and dataloader
    dataset = TensorDataset(X_tensor, y_tensor)
    train_loader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    # Define model
    class SimpleNN(pl.LightningModule):
        def __init__(self, input_size, hidden_size, num_classes, lr):
            super().__init__()
            self.save_hyperparameters()

            self.model = nn.Sequential(
                nn.Linear(input_size, hidden_size),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_size, hidden_size // 2),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(hidden_size // 2, num_classes)
            )
            self.criterion = nn.CrossEntropyLoss()

        def forward(self, x):
            return self.model(x)

        def training_step(self, batch, batch_idx):
            x, y = batch
            logits = self(x)
            loss = self.criterion(logits, y)
            self.log('train_loss', loss)
            return loss

        def configure_optimizers(self):
            return torch.optim.Adam(self.parameters(), lr=self.hparams.lr)

    # Initialize and train model
    input_size = X.shape[1]
    num_classes = len(torch.unique(y_tensor))
    model = SimpleNN(input_size, 128, num_classes, learning_rate)

    trainer = pl.Trainer(
        max_epochs=max_epochs,
        deterministic=True
    )

    trainer.fit(model, train_loader)

    # Save model
    torch.save(model.state_dict(), model_artifact.path)

    # Log metrics
    training_loss = trainer.callback_metrics.get('train_loss', 0.0)

    metrics = {
        "training_loss": float(training_loss),
        "epochs_completed": max_epochs,
        "model_parameters": sum(p.numel() for p in model.parameters())
    }

    with open(training_metrics.path, 'w') as f:
        json.dump(metrics, f)

    return metrics

@component(
    base_image="python:3.9",
    packages_to_install=["scikit-learn", "torch", "mlflow"]
)
def model_evaluation(
    model_artifact: Input[Model],
    test_data: Input[Dataset],
    evaluation_metrics: Output[ClassificationMetrics]
) -> dict:
    """Model evaluation component"""
    import torch
    import torch.nn as nn
    import pandas as pd
    from sklearn.metrics import accuracy_score, precision_recall_fscore_support
    import json

    # Load test data
    df = pd.read_csv(test_data.path)
    X_test = torch.FloatTensor(df.drop('target', axis=1).values)
    y_test = df['target'].values

    # Load model (simplified for example)
    # In practice, you'd reconstruct the exact model architecture
    model = nn.Sequential(
        nn.Linear(X_test.shape[1], 128),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(128, 64),
        nn.ReLU(),
        nn.Dropout(0.2),
        nn.Linear(64, len(set(y_test)))
    )

    # Load trained weights
    model.load_state_dict(torch.load(model_artifact.path))
    model.eval()

    # Make predictions
    with torch.no_grad():
        logits = model(X_test)
        predictions = torch.argmax(logits, dim=1).numpy()

    # Calculate metrics
    accuracy = accuracy_score(y_test, predictions)
    precision, recall, f1, _ = precision_recall_fscore_support(
        y_test, predictions, average='weighted'
    )

    metrics = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1_score": f1
    }

    # Save metrics
    with open(evaluation_metrics.path, 'w') as f:
        json.dump(metrics, f)

    return metrics

@pipeline(
    name="ml-training-pipeline",
    description="End-to-end ML training pipeline"
)
def ml_pipeline(
    raw_data_path: str,
    learning_rate: float = 0.001,
    batch_size: int = 32,
    max_epochs: int = 100
):
    """Complete ML pipeline"""

    # Step 1: Data preprocessing
    preprocessing_task = data_preprocessing(
        raw_data=raw_data_path,
        train_split=0.8
    )

    # Step 2: Model training
    training_task = model_training(
        training_data=preprocessing_task.outputs["processed_data"],
        learning_rate=learning_rate,
        batch_size=batch_size,
        max_epochs=max_epochs
    ).after(preprocessing_task)

    # Step 3: Model evaluation
    evaluation_task = model_evaluation(
        model_artifact=training_task.outputs["model_artifact"],
        test_data=preprocessing_task.outputs["processed_data"]
    ).after(training_task)

# Compile pipeline
if __name__ == "__main__":
    compiler.Compiler().compile(
        pipeline_func=ml_pipeline,
        package_path="ml_pipeline.yaml"
    )
```

### Model Monitoring & Drift Detection
```python
# Advanced model monitoring with drift detection
import numpy as np
import pandas as pd
from evidently import ColumnMapping
from evidently.report import Report
from evidently.metric_suite import MetricSuite
from evidently.metrics import DataDriftTable, DataQualityTable, RegressionQualityMetric
from evidently.test_suite import TestSuite
from evidently.tests import TestNumberOfColumnsWithDrift, TestShareOfMissingValues
import mlflow
import logging
from typing import Dict, Any, Tuple
import json
from datetime import datetime, timedelta

class ModelMonitor:
    def __init__(self, reference_data: pd.DataFrame, model_name: str):
        self.reference_data = reference_data
        self.model_name = model_name
        self.logger = logging.getLogger(__name__)

    def detect_data_drift(self, current_data: pd.DataFrame) -> Dict[str, Any]:
        """Detect data drift using statistical tests"""

        # Define column mapping
        column_mapping = ColumnMapping()
        if 'target' in current_data.columns:
            column_mapping.target = 'target'

        # Create data drift report
        data_drift_report = Report(metrics=[
            DataDriftTable(),
            DataQualityTable()
        ])

        data_drift_report.run(
            reference_data=self.reference_data,
            current_data=current_data,
            column_mapping=column_mapping
        )

        # Extract results
        report_dict = data_drift_report.as_dict()
        drift_results = report_dict['metrics'][0]['result']

        # Log results
        self.logger.info(f"Data drift detected for {drift_results['number_of_drifted_columns']} columns")

        return {
            'drift_detected': drift_results['dataset_drift'],
            'drifted_columns': drift_results['drifted_columns'],
            'drift_score': drift_results['drift_by_columns'],
            'timestamp': datetime.now().isoformat()
        }

    def evaluate_model_performance(self,
                                 current_data: pd.DataFrame,
                                 predictions: np.ndarray) -> Dict[str, Any]:
        """Evaluate current model performance"""

        if 'target' not in current_data.columns:
            self.logger.warning("No target column found for performance evaluation")
            return {}

        # Add predictions to dataframe
        eval_data = current_data.copy()
        eval_data['prediction'] = predictions

        # Create performance report
        performance_report = Report(metrics=[
            RegressionQualityMetric()  # Use ClassificationQualityMetric for classification
        ])

        column_mapping = ColumnMapping(
            target='target',
            prediction='prediction'
        )

        performance_report.run(
            reference_data=self.reference_data,
            current_data=eval_data,
            column_mapping=column_mapping
        )

        # Extract metrics
        report_dict = performance_report.as_dict()
        metrics = report_dict['metrics'][0]['result']['current']

        return {
            'mae': metrics['mean_abs_error'],
            'mse': metrics['mean_error'],
            'rmse': metrics['abs_error_std'],
            'r2_score': metrics.get('r2_score', 0),
            'timestamp': datetime.now().isoformat()
        }

    def run_quality_tests(self, current_data: pd.DataFrame) -> Dict[str, Any]:
        """Run data quality tests"""

        quality_tests = TestSuite(tests=[
            TestNumberOfColumnsWithDrift(),
            TestShareOfMissingValues()
        ])

        quality_tests.run(
            reference_data=self.reference_data,
            current_data=current_data
        )

        # Get test results
        test_results = quality_tests.as_dict()

        return {
            'tests_passed': all(test['status'] == 'SUCCESS' for test in test_results['tests']),
            'test_details': test_results['tests'],
            'timestamp': datetime.now().isoformat()
        }

    def log_monitoring_results(self, results: Dict[str, Any]):
        """Log monitoring results to MLflow"""

        with mlflow.start_run(run_name=f"monitoring_{self.model_name}"):
            # Log metrics
            if 'drift_detected' in results:
                mlflow.log_metric("drift_detected", int(results['drift_detected']))
                mlflow.log_metric("num_drifted_columns", len(results.get('drifted_columns', [])))

            if 'mae' in results:
                mlflow.log_metrics({
                    'current_mae': results['mae'],
                    'current_rmse': results['rmse'],
                    'current_r2': results['r2_score']
                })

            if 'tests_passed' in results:
                mlflow.log_metric("quality_tests_passed", int(results['tests_passed']))

            # Log artifacts
            with open("monitoring_report.json", "w") as f:
                json.dump(results, f, indent=2)

            mlflow.log_artifact("monitoring_report.json")

# Automated monitoring pipeline
class AutomatedMonitoring:
    def __init__(self, model_monitor: ModelMonitor, alert_threshold: float = 0.1):
        self.monitor = model_monitor
        self.alert_threshold = alert_threshold

    async def monitor_model(self, new_data: pd.DataFrame, predictions: np.ndarray):
        """Run complete monitoring pipeline"""

        results = {}

        # 1. Data drift detection
        drift_results = self.monitor.detect_data_drift(new_data)
        results.update(drift_results)

        # 2. Model performance evaluation
        performance_results = self.monitor.evaluate_model_performance(new_data, predictions)
        results.update(performance_results)

        # 3. Data quality tests
        quality_results = self.monitor.run_quality_tests(new_data)
        results.update(quality_results)

        # 4. Alert if necessary
        if self.should_alert(results):
            await self.send_alert(results)

        # 5. Log results
        self.monitor.log_monitoring_results(results)

        return results

    def should_alert(self, results: Dict[str, Any]) -> bool:
        """Determine if an alert should be sent"""

        # Alert conditions
        alert_conditions = [
            results.get('drift_detected', False),
            not results.get('tests_passed', True),
            results.get('current_mae', 0) > self.alert_threshold
        ]

        return any(alert_conditions)

    async def send_alert(self, results: Dict[str, Any]):
        """Send monitoring alert"""

        alert_message = f"""
        🚨 Model Monitoring Alert for {self.monitor.model_name}

        Timestamp: {results.get('timestamp', 'Unknown')}

        Issues Detected:
        - Data Drift: {'Yes' if results.get('drift_detected') else 'No'}
        - Quality Tests Failed: {'Yes' if not results.get('tests_passed', True) else 'No'}
        - Performance Degraded: {'Yes' if results.get('current_mae', 0) > self.alert_threshold else 'No'}

        Details: {json.dumps(results, indent=2)}
        """

        # Send to Slack, email, or other notification system
        self.monitor.logger.error(alert_message)
        # await send_slack_notification(alert_message)
```

## Skill Activation Triggers

This skill automatically activates when:
- Machine learning model development is needed
- MLOps pipeline setup is requested
- Model deployment and serving is required
- ML model monitoring and drift detection is needed
- AI system architecture design is requested
- Deep learning or NLP tasks are identified

This comprehensive machine learning skill provides expert-level capabilities for building, deploying, and maintaining production ML systems using modern tools and best practices.