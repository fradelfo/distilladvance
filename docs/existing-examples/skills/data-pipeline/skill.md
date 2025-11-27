# Data Pipeline Skill

Modern data engineering capabilities for building scalable, real-time data pipelines using cloud-native technologies and best practices.

## Skill Overview

Expert-level data pipeline design and implementation using modern data engineering tools including Apache Airflow, dbt, Apache Kafka, and cloud data platforms with focus on streaming, batch processing, and data quality.

## Core Capabilities

### ETL/ELT Pipeline Design
- **Batch processing** - Apache Airflow, Prefect, Dagster orchestration
- **Stream processing** - Apache Kafka, Apache Flink, Apache Beam
- **Change data capture** - Debezium, AWS DMS, Google Dataflow
- **Data transformation** - dbt, Apache Spark, Pandas optimization

### Real-time Data Streaming
- **Event streaming** - Kafka, Pulsar, Amazon Kinesis, Azure Event Hubs
- **Stream processing** - Kafka Streams, Apache Flink, Apache Storm
- **Event sourcing** - Event-driven architecture patterns
- **Complex event processing** - Real-time analytics and alerting

### Data Quality & Governance
- **Data validation** - Great Expectations, Pandera, custom validators
- **Data lineage** - Apache Atlas, DataHub, dbt lineage
- **Schema management** - Schema Registry, Protobuf, Avro schemas
- **Data cataloging** - Amundsen, DataHub, AWS Glue Catalog

## Modern Data Stack Implementation

### Apache Airflow DAGs
```python
# Modern Airflow DAG with TaskFlow API
from airflow import DAG
from airflow.decorators import dag, task
from airflow.providers.postgres.hooks.postgres import PostgresHook
from airflow.providers.amazon.aws.hooks.s3 import S3Hook
from datetime import datetime, timedelta
import pandas as pd

@dag(
    dag_id='modern_etl_pipeline',
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    default_args={
        'owner': 'data-team',
        'retries': 2,
        'retry_delay': timedelta(minutes=5),
        'email_on_failure': True,
        'email_on_retry': False
    },
    tags=['etl', 'daily', 'production']
)
def modern_etl_pipeline():

    @task(multiple_outputs=True)
    def extract_data(ds=None):
        """Extract data from multiple sources"""
        pg_hook = PostgresHook(postgres_conn_id='prod_db')

        # Extract user data
        user_query = """
        SELECT user_id, email, created_at, last_login
        FROM users
        WHERE DATE(created_at) = %s
        """

        users_df = pg_hook.get_pandas_df(user_query, parameters=[ds])

        # Extract events data
        events_query = """
        SELECT user_id, event_type, timestamp, properties
        FROM events
        WHERE DATE(timestamp) = %s
        """

        events_df = pg_hook.get_pandas_df(events_query, parameters=[ds])

        return {
            'users': users_df.to_json(),
            'events': events_df.to_json()
        }

    @task
    def transform_data(data_dict: dict):
        """Transform and enrich data"""
        users_df = pd.read_json(data_dict['users'])
        events_df = pd.read_json(data_dict['events'])

        # Data transformations
        users_df['user_age_days'] = (
            pd.Timestamp.now() - pd.to_datetime(users_df['created_at'])
        ).dt.days

        # Aggregate events per user
        user_events = events_df.groupby('user_id').agg({
            'event_type': 'count',
            'timestamp': 'max'
        }).rename(columns={
            'event_type': 'total_events',
            'timestamp': 'last_event'
        })

        # Join user and event data
        enriched_df = users_df.merge(
            user_events,
            on='user_id',
            how='left'
        ).fillna(0)

        return enriched_df.to_json()

    @task
    def validate_data(data_json: str):
        """Data quality validation with Great Expectations"""
        import great_expectations as ge

        df = pd.read_json(data_json)
        ge_df = ge.from_pandas(df)

        # Define expectations
        ge_df.expect_table_row_count_to_be_between(min_value=1, max_value=10000)
        ge_df.expect_column_values_to_not_be_null('user_id')
        ge_df.expect_column_values_to_match_regex('email', r'^[^@]+@[^@]+\.[^@]+$')
        ge_df.expect_column_values_to_be_between('user_age_days', min_value=0, max_value=3650)

        # Validate
        validation_result = ge_df.validate()

        if not validation_result['success']:
            raise ValueError(f"Data validation failed: {validation_result}")

        return data_json

    @task
    def load_data(validated_data: str):
        """Load data to warehouse and data lake"""
        df = pd.read_json(validated_data)

        # Load to PostgreSQL data warehouse
        pg_hook = PostgresHook(postgres_conn_id='warehouse_db')
        df.to_sql(
            'user_daily_summary',
            pg_hook.get_sqlalchemy_engine(),
            if_exists='append',
            index=False,
            method='multi'
        )

        # Load to S3 data lake
        s3_hook = S3Hook(aws_conn_id='aws_default')
        s3_key = f"data/user_summary/date={datetime.now().strftime('%Y-%m-%d')}/data.parquet"

        df.to_parquet('/tmp/data.parquet')
        s3_hook.load_file(
            filename='/tmp/data.parquet',
            key=s3_key,
            bucket_name='data-lake-bucket'
        )

    # Define task dependencies
    extracted_data = extract_data()
    transformed_data = transform_data(extracted_data)
    validated_data = validate_data(transformed_data)
    load_data(validated_data)

# Instantiate the DAG
etl_dag = modern_etl_pipeline()
```

### dbt Data Transformations
```sql
-- models/staging/stg_users.sql
{{ config(materialized='view') }}

SELECT
    user_id,
    email,
    LOWER(email) as email_normalized,
    created_at,
    last_login,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/86400 as user_age_days,
    CASE
        WHEN last_login >= CURRENT_DATE - INTERVAL '7 days' THEN 'active'
        WHEN last_login >= CURRENT_DATE - INTERVAL '30 days' THEN 'inactive'
        ELSE 'churned'
    END as user_status
FROM {{ source('app_db', 'users') }}
WHERE created_at IS NOT NULL

-- models/marts/user_metrics.sql
{{ config(
    materialized='table',
    indexes=[
        {'columns': ['date'], 'type': 'btree'},
        {'columns': ['user_id'], 'type': 'btree'}
    ]
) }}

WITH daily_events AS (
    SELECT
        user_id,
        DATE(timestamp) as event_date,
        COUNT(*) as daily_events,
        COUNT(DISTINCT event_type) as unique_event_types
    FROM {{ ref('stg_events') }}
    GROUP BY user_id, DATE(timestamp)
),

user_cohorts AS (
    SELECT
        user_id,
        DATE_TRUNC('month', created_at) as cohort_month
    FROM {{ ref('stg_users') }}
)

SELECT
    u.user_id,
    u.email_normalized,
    u.user_status,
    u.user_age_days,
    uc.cohort_month,
    COALESCE(de.daily_events, 0) as daily_events,
    COALESCE(de.unique_event_types, 0) as unique_event_types,
    CURRENT_DATE as calculated_date
FROM {{ ref('stg_users') }} u
LEFT JOIN user_cohorts uc ON u.user_id = uc.user_id
LEFT JOIN daily_events de ON u.user_id = de.user_id
    AND de.event_date = CURRENT_DATE
```

### Apache Kafka Streaming
```python
# Real-time stream processing with Kafka
from kafka import KafkaConsumer, KafkaProducer
from kafka.errors import KafkaError
import json
import logging
from datetime import datetime
import pandas as pd
from typing import Dict, List

class StreamProcessor:
    def __init__(self, bootstrap_servers: List[str]):
        self.bootstrap_servers = bootstrap_servers
        self.consumer = None
        self.producer = None

    def setup_consumer(self, topics: List[str], group_id: str):
        """Setup Kafka consumer with optimal configurations"""
        self.consumer = KafkaConsumer(
            *topics,
            bootstrap_servers=self.bootstrap_servers,
            group_id=group_id,
            value_deserializer=lambda x: json.loads(x.decode('utf-8')),
            auto_offset_reset='latest',
            enable_auto_commit=True,
            auto_commit_interval_ms=1000,
            max_poll_records=500,
            max_poll_interval_ms=300000
        )

    def setup_producer(self):
        """Setup Kafka producer with optimal configurations"""
        self.producer = KafkaProducer(
            bootstrap_servers=self.bootstrap_servers,
            value_serializer=lambda x: json.dumps(x).encode('utf-8'),
            acks='all',
            retries=3,
            batch_size=16384,
            linger_ms=10,
            buffer_memory=33554432
        )

    def process_user_events(self):
        """Real-time user event processing"""
        user_sessions = {}

        for message in self.consumer:
            try:
                event = message.value
                user_id = event['user_id']
                event_type = event['event_type']
                timestamp = datetime.fromisoformat(event['timestamp'])

                # Update user session
                if user_id not in user_sessions:
                    user_sessions[user_id] = {
                        'session_start': timestamp,
                        'last_activity': timestamp,
                        'events': [],
                        'page_views': 0,
                        'purchases': 0
                    }

                session = user_sessions[user_id]
                session['last_activity'] = timestamp
                session['events'].append(event)

                # Track specific events
                if event_type == 'page_view':
                    session['page_views'] += 1
                elif event_type == 'purchase':
                    session['purchases'] += 1

                # Check for session timeout (30 minutes)
                session_duration = (timestamp - session['session_start']).total_seconds()
                if session_duration > 1800:  # 30 minutes
                    self._finalize_session(user_id, session)
                    del user_sessions[user_id]

                # Real-time analytics
                self._update_real_time_metrics(event)

            except Exception as e:
                logging.error(f"Error processing message: {e}")
                continue

    def _finalize_session(self, user_id: str, session: Dict):
        """Finalize user session and send to analytics topic"""
        session_summary = {
            'user_id': user_id,
            'session_start': session['session_start'].isoformat(),
            'session_end': session['last_activity'].isoformat(),
            'duration_minutes': (
                session['last_activity'] - session['session_start']
            ).total_seconds() / 60,
            'total_events': len(session['events']),
            'page_views': session['page_views'],
            'purchases': session['purchases'],
            'conversion': session['purchases'] > 0
        }

        # Send to session analytics topic
        self.producer.send('user_sessions', session_summary)

    def _update_real_time_metrics(self, event: Dict):
        """Update real-time dashboards and alerts"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'event_type': event['event_type'],
            'user_id': event['user_id'],
            'properties': event.get('properties', {})
        }

        # Send to real-time metrics topic
        self.producer.send('real_time_metrics', metrics)
```

### Apache Flink Stream Processing
```python
# Complex event processing with Apache Flink
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment, EnvironmentSettings
from pyflink.datastream.connectors import FlinkKafkaConsumer, FlinkKafkaProducer
from pyflink.common.serialization import SimpleStringSchema

def create_flink_pipeline():
    """Create Flink streaming pipeline for real-time analytics"""

    # Setup Flink environment
    env = StreamExecutionEnvironment.get_execution_environment()
    env.set_parallelism(4)
    env.enable_checkpointing(5000)

    # Table environment for SQL operations
    settings = EnvironmentSettings.new_instance().in_streaming_mode().use_blink_planner().build()
    table_env = StreamTableEnvironment.create(env, settings)

    # Define Kafka source
    kafka_source = FlinkKafkaConsumer(
        topics=['user_events'],
        deserialization_schema=SimpleStringSchema(),
        properties={
            'bootstrap.servers': 'localhost:9092',
            'group.id': 'flink_processor'
        }
    )

    # Create source stream
    events_stream = env.add_source(kafka_source)

    # Register as table for SQL processing
    table_env.register_data_stream('events', events_stream)

    # SQL queries for real-time analytics
    table_env.execute_sql("""
        CREATE TABLE user_events (
            user_id STRING,
            event_type STRING,
            timestamp TIMESTAMP(3),
            properties MAP<STRING, STRING>,
            WATERMARK FOR timestamp AS timestamp - INTERVAL '5' SECOND
        ) WITH (
            'connector' = 'kafka',
            'topic' = 'user_events',
            'properties.bootstrap.servers' = 'localhost:9092',
            'format' = 'json'
        )
    """)

    # Real-time aggregations
    table_env.execute_sql("""
        CREATE TABLE event_counts AS
        SELECT
            user_id,
            event_type,
            COUNT(*) as event_count,
            TUMBLE_END(timestamp, INTERVAL '1' MINUTE) as window_end
        FROM user_events
        GROUP BY
            user_id,
            event_type,
            TUMBLE(timestamp, INTERVAL '1' MINUTE)
    """)

    # Complex event patterns (CEP)
    table_env.execute_sql("""
        CREATE TABLE purchase_funnel AS
        SELECT *
        FROM user_events
        MATCH_RECOGNIZE (
            PARTITION BY user_id
            ORDER BY timestamp
            MEASURES
                A.timestamp AS start_time,
                B.timestamp AS view_time,
                C.timestamp AS purchase_time
            PATTERN (A B* C)
            DEFINE
                A AS A.event_type = 'session_start',
                B AS B.event_type = 'page_view',
                C AS C.event_type = 'purchase'
        )
    """)

# Data Quality Monitoring
class DataQualityMonitor:
    def __init__(self, expectations_suite_path: str):
        import great_expectations as ge
        self.context = ge.get_context()
        self.suite = self.context.get_expectation_suite(expectations_suite_path)

    def validate_batch(self, df: pd.DataFrame) -> Dict:
        """Validate data batch against expectations"""
        import great_expectations as ge

        batch = ge.from_pandas(df)
        validation_result = batch.validate(expectation_suite=self.suite)

        # Generate alerts for failed expectations
        if not validation_result.success:
            self._send_data_quality_alert(validation_result)

        return validation_result.to_json_dict()

    def _send_data_quality_alert(self, validation_result):
        """Send alerts for data quality issues"""
        failed_expectations = [
            exp for exp in validation_result.results
            if not exp.success
        ]

        alert = {
            'timestamp': datetime.now().isoformat(),
            'level': 'ERROR',
            'type': 'data_quality_failure',
            'failed_expectations': len(failed_expectations),
            'details': failed_expectations[:5]  # First 5 failures
        }

        # Send to monitoring system
        self._send_to_slack(alert)
        self._send_to_pagerduty(alert)
```

## Cloud Data Platform Integration

### AWS Data Pipeline
```python
# AWS-native data pipeline with Step Functions
import boto3
import json
from datetime import datetime

class AWSDataPipeline:
    def __init__(self):
        self.glue = boto3.client('glue')
        self.s3 = boto3.client('s3')
        self.stepfunctions = boto3.client('stepfunctions')
        self.athena = boto3.client('athena')

    def create_glue_job(self, job_name: str, script_location: str):
        """Create AWS Glue ETL job"""
        response = self.glue.create_job(
            Name=job_name,
            Role='arn:aws:iam::account:role/GlueServiceRole',
            Command={
                'Name': 'glueetl',
                'ScriptLocation': script_location,
                'PythonVersion': '3'
            },
            DefaultArguments={
                '--TempDir': 's3://glue-temp-bucket/temp/',
                '--job-bookmark-option': 'job-bookmark-enable',
                '--enable-metrics': '',
                '--enable-spark-ui': 'true',
                '--spark-event-logs-path': 's3://spark-logs-bucket/logs/'
            },
            MaxRetries=2,
            Timeout=60,
            GlueVersion='3.0',
            NumberOfWorkers=10,
            WorkerType='G.1X'
        )
        return response

    def create_step_function(self, state_machine_name: str):
        """Create Step Functions state machine for pipeline orchestration"""
        definition = {
            "Comment": "Data pipeline orchestration",
            "StartAt": "ExtractData",
            "States": {
                "ExtractData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::glue:startJobRun.sync",
                    "Parameters": {
                        "JobName": "extract-job"
                    },
                    "Next": "TransformData"
                },
                "TransformData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::glue:startJobRun.sync",
                    "Parameters": {
                        "JobName": "transform-job"
                    },
                    "Next": "ValidateData"
                },
                "ValidateData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": "data-validation-function"
                    },
                    "Next": "LoadData"
                },
                "LoadData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::glue:startJobRun.sync",
                    "Parameters": {
                        "JobName": "load-job"
                    },
                    "End": True
                }
            }
        }

        response = self.stepfunctions.create_state_machine(
            name=state_machine_name,
            definition=json.dumps(definition),
            roleArn='arn:aws:iam::account:role/StepFunctionsRole'
        )
        return response
```

## Skill Activation Triggers

This skill automatically activates when:
- Data pipeline design or implementation is requested
- ETL/ELT process development is needed
- Real-time streaming solutions are required
- Data quality monitoring is requested
- Data warehouse or lake architecture is needed
- Workflow orchestration setup is required

This comprehensive data pipeline skill enables building modern, scalable data infrastructure with best practices for reliability, monitoring, and data quality.