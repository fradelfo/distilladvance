# IoT Development Skill

Advanced Internet of Things (IoT) development expertise covering edge computing, device communication protocols, sensor integration, data processing pipelines, and scalable IoT platform architecture.

## Skill Overview

Expert IoT knowledge including embedded systems programming, wireless communication protocols, sensor data processing, edge computing, cloud IoT platforms, device management, and industrial IoT applications.

## Core Capabilities

### Device Programming & Protocols
- **Embedded development** - Arduino, Raspberry Pi, ESP32/ESP8266, ARM Cortex-M programming
- **Communication protocols** - MQTT, CoAP, LoRaWAN, Zigbee, BLE, Wi-Fi, cellular
- **Sensor integration** - Temperature, humidity, pressure, motion, GPS, camera modules
- **Actuator control** - Motors, servos, relays, LED strips, display modules

### Edge Computing & Processing
- **Edge AI/ML** - TensorFlow Lite, OpenCV, computer vision on edge devices
- **Local data processing** - Stream processing, data filtering, compression, caching
- **Offline operation** - Local storage, sync mechanisms, connectivity resilience
- **Real-time systems** - RTOS development, interrupt handling, timing-critical operations

### IoT Platform Development
- **Device management** - Provisioning, configuration, firmware updates, monitoring
- **Data ingestion** - Time series databases, message brokers, streaming platforms
- **Analytics & visualization** - Dashboards, alerting, predictive maintenance
- **Security implementation** - Device authentication, encrypted communication, secure boot

### Enterprise IoT Solutions
- **Industrial IoT** - SCADA integration, OPC-UA, predictive maintenance, asset tracking
- **Smart cities** - Environmental monitoring, traffic management, energy optimization
- **Agriculture IoT** - Soil monitoring, irrigation control, livestock tracking
- **Healthcare IoT** - Remote monitoring, wearable devices, patient tracking systems

## Modern IoT Development Implementation

### Comprehensive IoT Platform with Python and Go
```python
# Advanced IoT platform with device management, data processing, and analytics
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import aioredis
import aiomqtt
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel, validator
import numpy as np
import pandas as pd
from influxdb_client.client.influxdb_client_async import InfluxDBClientAsync
from influxdb_client.client.write_api_async import WriteApiAsync
import tensorflow as tf
import cv2
import serial
import paho.mqtt.client as mqtt
from cryptography.fernet import Fernet
import hashlib
import uuid

# Data models and types
class DeviceStatus(Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"

class SensorType(Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    PRESSURE = "pressure"
    MOTION = "motion"
    LIGHT = "light"
    GPS = "gps"
    CAMERA = "camera"
    ACCELEROMETER = "accelerometer"

@dataclass
class SensorReading:
    device_id: str
    sensor_type: SensorType
    value: float
    unit: str
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class DeviceInfo:
    device_id: str
    device_type: str
    name: str
    location: str
    firmware_version: str
    status: DeviceStatus
    last_seen: datetime
    battery_level: Optional[float] = None
    configuration: Optional[Dict[str, Any]] = None

class IoTMessage(BaseModel):
    device_id: str
    message_type: str
    payload: Dict[str, Any]
    timestamp: Optional[datetime] = None

    @validator('timestamp', pre=True, always=True)
    def set_timestamp(cls, v):
        return v or datetime.utcnow()

# Core IoT Platform Class
class IoTPlatform:
    """Comprehensive IoT platform for device management and data processing"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Initialize components
        self.devices: Dict[str, DeviceInfo] = {}
        self.device_handlers: Dict[str, Callable] = {}
        self.data_processors: Dict[SensorType, List[Callable]] = {}
        self.alert_rules: List[Dict[str, Any]] = []

        # Database and storage
        self.engine = create_async_engine(config['database_url'])
        self.Session = sessionmaker(self.engine, class_=AsyncSession)

        # Message broker
        self.mqtt_client = None
        self.redis_client = None

        # Analytics and ML
        self.ml_models: Dict[str, tf.keras.Model] = {}
        self.time_series_db = None

        # Security
        self.encryption_key = Fernet.generate_key()
        self.cipher_suite = Fernet(self.encryption_key)

    async def initialize(self):
        """Initialize all platform components"""

        # Initialize Redis connection
        self.redis_client = await aioredis.from_url(
            self.config['redis_url'],
            encoding='utf-8',
            decode_responses=True
        )

        # Initialize InfluxDB for time series data
        self.time_series_db = InfluxDBClientAsync(
            url=self.config['influxdb_url'],
            token=self.config['influxdb_token'],
            org=self.config['influxdb_org']
        )

        # Setup MQTT client
        await self.setup_mqtt()

        # Load ML models
        await self.load_ml_models()

        # Start background tasks
        asyncio.create_task(self.device_heartbeat_monitor())
        asyncio.create_task(self.data_processing_worker())
        asyncio.create_task(self.alert_processor())

        self.logger.info("IoT Platform initialized successfully")

    async def setup_mqtt(self):
        """Setup MQTT client for device communication"""

        async def on_connect(client, userdata, flags, rc):
            self.logger.info(f"Connected to MQTT broker with result code {rc}")
            # Subscribe to device topics
            await client.subscribe("devices/+/telemetry")
            await client.subscribe("devices/+/status")
            await client.subscribe("devices/+/alerts")

        async def on_message(client, userdata, message):
            await self.handle_mqtt_message(message)

        self.mqtt_client = aiomqtt.Client(
            hostname=self.config['mqtt_host'],
            port=self.config['mqtt_port'],
            username=self.config.get('mqtt_username'),
            password=self.config.get('mqtt_password')
        )

    async def handle_mqtt_message(self, message):
        """Process incoming MQTT messages from devices"""
        try:
            topic_parts = message.topic.split('/')
            device_id = topic_parts[1]
            message_type = topic_parts[2]

            payload = json.loads(message.payload.decode())

            iot_message = IoTMessage(
                device_id=device_id,
                message_type=message_type,
                payload=payload
            )

            # Route message based on type
            if message_type == 'telemetry':
                await self.process_telemetry(iot_message)
            elif message_type == 'status':
                await self.process_device_status(iot_message)
            elif message_type == 'alerts':
                await self.process_device_alert(iot_message)

        except Exception as e:
            self.logger.error(f"Error processing MQTT message: {e}")

    async def process_telemetry(self, message: IoTMessage):
        """Process sensor telemetry data"""
        device_id = message.device_id
        payload = message.payload

        # Extract sensor readings
        readings = []
        for sensor_data in payload.get('sensors', []):
            try:
                reading = SensorReading(
                    device_id=device_id,
                    sensor_type=SensorType(sensor_data['type']),
                    value=float(sensor_data['value']),
                    unit=sensor_data.get('unit', ''),
                    timestamp=message.timestamp,
                    metadata=sensor_data.get('metadata', {})
                )
                readings.append(reading)
            except (KeyError, ValueError) as e:
                self.logger.warning(f"Invalid sensor data from {device_id}: {e}")

        # Store readings in time series database
        await self.store_telemetry(readings)

        # Process readings through data pipeline
        for reading in readings:
            await self.run_data_processors(reading)

        # Update device last seen
        await self.update_device_last_seen(device_id)

    async def store_telemetry(self, readings: List[SensorReading]):
        """Store sensor readings in time series database"""
        if not self.time_series_db:
            return

        try:
            write_api = self.time_series_db.write_api()
            points = []

            for reading in readings:
                point = {
                    "measurement": "sensor_data",
                    "tags": {
                        "device_id": reading.device_id,
                        "sensor_type": reading.sensor_type.value,
                        "unit": reading.unit
                    },
                    "fields": {
                        "value": reading.value
                    },
                    "time": reading.timestamp
                }

                if reading.metadata:
                    point["tags"].update({
                        f"meta_{k}": str(v) for k, v in reading.metadata.items()
                    })

                points.append(point)

            await write_api.write(
                bucket=self.config['influxdb_bucket'],
                record=points
            )

        except Exception as e:
            self.logger.error(f"Failed to store telemetry data: {e}")

    async def run_data_processors(self, reading: SensorReading):
        """Run data through registered processors"""
        processors = self.data_processors.get(reading.sensor_type, [])

        for processor in processors:
            try:
                result = await processor(reading)
                if result:
                    # Store processed result or trigger actions
                    await self.handle_processor_result(reading, result)
            except Exception as e:
                self.logger.error(f"Error in data processor: {e}")

    # Device Management
    async def register_device(self, device_info: DeviceInfo) -> bool:
        """Register a new IoT device"""
        try:
            # Validate device
            if device_info.device_id in self.devices:
                self.logger.warning(f"Device {device_info.device_id} already registered")
                return False

            # Store device info
            self.devices[device_info.device_id] = device_info

            # Store in Redis for fast lookup
            await self.redis_client.set(
                f"device:{device_info.device_id}",
                json.dumps(asdict(device_info), default=str),
                ex=86400  # 24 hour expiry
            )

            # Store in database
            async with self.Session() as session:
                # Implementation would use SQLAlchemy models
                pass

            # Send initial configuration to device
            await self.send_device_configuration(device_info.device_id)

            self.logger.info(f"Device {device_info.device_id} registered successfully")
            return True

        except Exception as e:
            self.logger.error(f"Failed to register device {device_info.device_id}: {e}")
            return False

    async def send_device_configuration(self, device_id: str):
        """Send configuration to device"""
        device = self.devices.get(device_id)
        if not device or not device.configuration:
            return

        config_message = {
            "type": "configuration",
            "config": device.configuration,
            "timestamp": datetime.utcnow().isoformat()
        }

        topic = f"devices/{device_id}/config"

        if self.mqtt_client:
            await self.mqtt_client.publish(
                topic,
                json.dumps(config_message),
                qos=1
            )

    async def update_device_firmware(self, device_id: str, firmware_url: str) -> bool:
        """Trigger OTA firmware update"""
        try:
            device = self.devices.get(device_id)
            if not device:
                return False

            update_message = {
                "type": "firmware_update",
                "firmware_url": firmware_url,
                "version": "latest",
                "checksum": await self.calculate_firmware_checksum(firmware_url),
                "timestamp": datetime.utcnow().isoformat()
            }

            topic = f"devices/{device_id}/commands"

            if self.mqtt_client:
                await self.mqtt_client.publish(
                    topic,
                    json.dumps(update_message),
                    qos=1
                )

            self.logger.info(f"Firmware update triggered for device {device_id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to trigger firmware update for {device_id}: {e}")
            return False

    # Data Processing and Analytics
    def register_data_processor(self, sensor_type: SensorType, processor: Callable):
        """Register a data processor for specific sensor type"""
        if sensor_type not in self.data_processors:
            self.data_processors[sensor_type] = []

        self.data_processors[sensor_type].append(processor)

    async def temperature_anomaly_detector(self, reading: SensorReading) -> Optional[Dict[str, Any]]:
        """Example data processor: detect temperature anomalies"""
        if reading.sensor_type != SensorType.TEMPERATURE:
            return None

        # Get historical data for comparison
        historical_data = await self.get_historical_data(
            reading.device_id,
            SensorType.TEMPERATURE,
            hours=24
        )

        if len(historical_data) < 10:
            return None  # Not enough data

        # Calculate statistical measures
        values = [d['value'] for d in historical_data]
        mean = np.mean(values)
        std = np.std(values)

        # Check for anomaly (value outside 2 standard deviations)
        if abs(reading.value - mean) > 2 * std:
            return {
                "type": "temperature_anomaly",
                "current_value": reading.value,
                "expected_range": (mean - 2*std, mean + 2*std),
                "severity": "high" if abs(reading.value - mean) > 3 * std else "medium"
            }

        return None

    async def predictive_maintenance_analyzer(self, reading: SensorReading) -> Optional[Dict[str, Any]]:
        """Example ML-based predictive maintenance"""
        device_id = reading.device_id

        # Get ML model for this device type
        device = self.devices.get(device_id)
        if not device:
            return None

        model_key = f"maintenance_{device.device_type}"
        model = self.ml_models.get(model_key)

        if not model:
            return None

        # Prepare features
        features = await self.prepare_maintenance_features(device_id)
        if features is None:
            return None

        # Run prediction
        prediction = model.predict(features.reshape(1, -1))
        maintenance_probability = prediction[0][0]

        # Trigger alert if probability is high
        if maintenance_probability > 0.7:
            return {
                "type": "maintenance_required",
                "probability": float(maintenance_probability),
                "recommended_action": "Schedule maintenance within 7 days",
                "priority": "high" if maintenance_probability > 0.9 else "medium"
            }

        return None

    # Machine Learning Integration
    async def load_ml_models(self):
        """Load pre-trained ML models"""
        try:
            # Load predictive maintenance models
            maintenance_model_path = self.config.get('ml_models', {}).get('maintenance')
            if maintenance_model_path:
                self.ml_models['maintenance'] = tf.keras.models.load_model(maintenance_model_path)

            # Load anomaly detection models
            anomaly_model_path = self.config.get('ml_models', {}).get('anomaly')
            if anomaly_model_path:
                self.ml_models['anomaly'] = tf.keras.models.load_model(anomaly_model_path)

            self.logger.info("ML models loaded successfully")

        except Exception as e:
            self.logger.error(f"Failed to load ML models: {e}")

    async def prepare_maintenance_features(self, device_id: str) -> Optional[np.ndarray]:
        """Prepare features for maintenance prediction"""
        try:
            # Get recent sensor data
            historical_data = await self.get_historical_data(device_id, hours=168)  # 7 days

            if len(historical_data) < 100:
                return None

            # Calculate features
            df = pd.DataFrame(historical_data)
            features = []

            # Statistical features
            for sensor_type in ['temperature', 'vibration', 'pressure']:
                sensor_data = df[df['sensor_type'] == sensor_type]['value']
                if len(sensor_data) > 0:
                    features.extend([
                        sensor_data.mean(),
                        sensor_data.std(),
                        sensor_data.min(),
                        sensor_data.max()
                    ])
                else:
                    features.extend([0, 0, 0, 0])

            # Time-based features
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df['hour'] = df['timestamp'].dt.hour
            df['day_of_week'] = df['timestamp'].dt.dayofweek

            features.extend([
                df['hour'].value_counts().std(),  # Operating hour variability
                df['day_of_week'].nunique()       # Days of operation
            ])

            return np.array(features)

        except Exception as e:
            self.logger.error(f"Failed to prepare maintenance features: {e}")
            return None

    # Edge Computing Support
    async def deploy_edge_model(self, device_id: str, model_type: str, model_data: bytes) -> bool:
        """Deploy ML model to edge device"""
        try:
            # Compress and encrypt model
            compressed_model = self.compress_model(model_data)
            encrypted_model = self.cipher_suite.encrypt(compressed_model)

            # Send to device in chunks
            chunk_size = 1024  # 1KB chunks
            chunks = [encrypted_model[i:i+chunk_size] for i in range(0, len(encrypted_model), chunk_size)]

            # Send deployment command
            deploy_message = {
                "type": "model_deployment",
                "model_type": model_type,
                "total_chunks": len(chunks),
                "model_hash": hashlib.sha256(model_data).hexdigest()
            }

            topic = f"devices/{device_id}/models"
            await self.mqtt_client.publish(topic, json.dumps(deploy_message), qos=1)

            # Send model chunks
            for i, chunk in enumerate(chunks):
                chunk_message = {
                    "chunk_index": i,
                    "data": chunk.hex(),
                    "is_last": i == len(chunks) - 1
                }

                await self.mqtt_client.publish(
                    f"{topic}/chunks",
                    json.dumps(chunk_message),
                    qos=1
                )

                # Small delay between chunks
                await asyncio.sleep(0.1)

            self.logger.info(f"Model {model_type} deployed to device {device_id}")
            return True

        except Exception as e:
            self.logger.error(f"Failed to deploy model to device {device_id}: {e}")
            return False

    # Alert and Monitoring System
    async def add_alert_rule(self, rule: Dict[str, Any]):
        """Add alerting rule"""
        rule['id'] = str(uuid.uuid4())
        rule['created_at'] = datetime.utcnow()
        self.alert_rules.append(rule)

        # Store in Redis
        await self.redis_client.set(
            f"alert_rule:{rule['id']}",
            json.dumps(rule, default=str)
        )

    async def evaluate_alert_rules(self, reading: SensorReading):
        """Evaluate alert rules against sensor reading"""
        for rule in self.alert_rules:
            try:
                if await self.check_rule_conditions(rule, reading):
                    await self.trigger_alert(rule, reading)
            except Exception as e:
                self.logger.error(f"Error evaluating alert rule {rule.get('id')}: {e}")

    async def check_rule_conditions(self, rule: Dict[str, Any], reading: SensorReading) -> bool:
        """Check if alert rule conditions are met"""
        # Device filter
        if 'device_ids' in rule and reading.device_id not in rule['device_ids']:
            return False

        # Sensor type filter
        if 'sensor_types' in rule and reading.sensor_type.value not in rule['sensor_types']:
            return False

        # Value conditions
        conditions = rule.get('conditions', {})

        if 'min_value' in conditions and reading.value < conditions['min_value']:
            return True

        if 'max_value' in conditions and reading.value > conditions['max_value']:
            return True

        if 'equals' in conditions and reading.value == conditions['equals']:
            return True

        return False

    async def trigger_alert(self, rule: Dict[str, Any], reading: SensorReading):
        """Trigger alert based on rule"""
        alert = {
            "id": str(uuid.uuid4()),
            "rule_id": rule['id'],
            "device_id": reading.device_id,
            "sensor_type": reading.sensor_type.value,
            "value": reading.value,
            "message": rule.get('message', 'Alert condition met'),
            "severity": rule.get('severity', 'medium'),
            "timestamp": datetime.utcnow(),
            "acknowledged": False
        }

        # Store alert
        await self.redis_client.set(
            f"alert:{alert['id']}",
            json.dumps(alert, default=str)
        )

        # Send notifications
        await self.send_alert_notifications(alert)

    # Background Tasks
    async def device_heartbeat_monitor(self):
        """Monitor device heartbeats and update status"""
        while True:
            try:
                current_time = datetime.utcnow()
                offline_threshold = timedelta(minutes=5)

                for device_id, device in self.devices.items():
                    if current_time - device.last_seen > offline_threshold:
                        if device.status != DeviceStatus.OFFLINE:
                            device.status = DeviceStatus.OFFLINE
                            await self.handle_device_offline(device_id)

                await asyncio.sleep(60)  # Check every minute

            except Exception as e:
                self.logger.error(f"Error in heartbeat monitor: {e}")
                await asyncio.sleep(60)

    async def data_processing_worker(self):
        """Background worker for data processing"""
        while True:
            try:
                # Process queued data
                await asyncio.sleep(10)

            except Exception as e:
                self.logger.error(f"Error in data processing worker: {e}")
                await asyncio.sleep(10)

    async def alert_processor(self):
        """Background processor for alerts"""
        while True:
            try:
                # Process pending alerts
                await asyncio.sleep(5)

            except Exception as e:
                self.logger.error(f"Error in alert processor: {e}")
                await asyncio.sleep(5)

    # Utility Methods
    async def get_historical_data(self, device_id: str, sensor_type: Optional[SensorType] = None, hours: int = 24) -> List[Dict[str, Any]]:
        """Retrieve historical sensor data"""
        if not self.time_series_db:
            return []

        try:
            query = f'''
            from(bucket: "{self.config['influxdb_bucket']}")
              |> range(start: -{hours}h)
              |> filter(fn: (r) => r._measurement == "sensor_data")
              |> filter(fn: (r) => r.device_id == "{device_id}")
            '''

            if sensor_type:
                query += f'|> filter(fn: (r) => r.sensor_type == "{sensor_type.value}")'

            query_api = self.time_series_db.query_api()
            result = await query_api.query(query)

            data = []
            for table in result:
                for record in table.records:
                    data.append({
                        "timestamp": record.get_time(),
                        "sensor_type": record.values.get("sensor_type"),
                        "value": record.get_value(),
                        "unit": record.values.get("unit")
                    })

            return data

        except Exception as e:
            self.logger.error(f"Failed to get historical data: {e}")
            return []

    def compress_model(self, model_data: bytes) -> bytes:
        """Compress ML model for edge deployment"""
        import gzip
        return gzip.compress(model_data)

    async def calculate_firmware_checksum(self, firmware_url: str) -> str:
        """Calculate firmware checksum for integrity verification"""
        # Implementation would download and hash firmware
        return hashlib.sha256(b"dummy_firmware").hexdigest()

    async def close(self):
        """Cleanup resources"""
        if self.mqtt_client:
            await self.mqtt_client.disconnect()

        if self.redis_client:
            await self.redis_client.close()

        if self.time_series_db:
            await self.time_series_db.close()

# Example usage and configuration
async def main():
    """Example IoT platform usage"""

    config = {
        'database_url': 'postgresql://user:pass@localhost/iot_platform',
        'redis_url': 'redis://localhost:6379',
        'mqtt_host': 'localhost',
        'mqtt_port': 1883,
        'influxdb_url': 'http://localhost:8086',
        'influxdb_token': 'your_token_here',
        'influxdb_org': 'your_org',
        'influxdb_bucket': 'iot_data',
        'ml_models': {
            'maintenance': '/path/to/maintenance_model.h5',
            'anomaly': '/path/to/anomaly_model.h5'
        }
    }

    # Initialize platform
    platform = IoTPlatform(config)
    await platform.initialize()

    # Register data processors
    platform.register_data_processor(
        SensorType.TEMPERATURE,
        platform.temperature_anomaly_detector
    )

    platform.register_data_processor(
        SensorType.TEMPERATURE,
        platform.predictive_maintenance_analyzer
    )

    # Add alert rules
    await platform.add_alert_rule({
        "name": "High Temperature Alert",
        "device_ids": ["sensor_001", "sensor_002"],
        "sensor_types": ["temperature"],
        "conditions": {"max_value": 35.0},
        "message": "Temperature exceeded safe threshold",
        "severity": "high"
    })

    # Register example device
    device_info = DeviceInfo(
        device_id="sensor_001",
        device_type="environmental",
        name="Office Temperature Sensor",
        location="Building A, Floor 1",
        firmware_version="1.2.3",
        status=DeviceStatus.ONLINE,
        last_seen=datetime.utcnow(),
        configuration={
            "reporting_interval": 60,
            "temperature_unit": "celsius",
            "precision": 0.1
        }
    )

    await platform.register_device(device_info)

    # Keep platform running
    try:
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        await platform.close()

if __name__ == "__main__":
    asyncio.run(main())
```

## Skill Activation Triggers

This skill automatically activates when:
- IoT device development is needed
- Sensor data processing is required
- Edge computing implementation is requested
- Device management systems are needed
- Industrial IoT solutions are required
- Smart building or smart city projects are requested

This comprehensive IoT development skill provides expert-level capabilities for building modern, scalable IoT platforms with advanced features for device management, data processing, and analytics.