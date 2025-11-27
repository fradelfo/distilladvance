# Game Development Skill

Modern game development expertise covering Unity, Unreal Engine, gameplay programming, graphics optimization, multiplayer systems, and cross-platform deployment for mobile, PC, and console games.

## Skill Overview

Expert game development knowledge including game engines, gameplay mechanics, graphics programming, audio systems, multiplayer networking, performance optimization, and modern game development pipelines.

## Core Capabilities

### Game Engine Mastery
- **Unity development** - C# scripting, component systems, asset pipelines, optimization
- **Unreal Engine** - Blueprint visual scripting, C++ programming, material systems
- **Godot development** - GDScript, scene management, cross-platform deployment
- **Custom engine** - OpenGL/Vulkan, physics integration, asset streaming

### Gameplay Programming
- **Game mechanics** - Player controllers, AI behavior trees, state machines
- **Physics systems** - Rigidbody dynamics, collision detection, custom physics
- **Animation systems** - State machines, blend trees, inverse kinematics
- **UI/UX systems** - Menu systems, HUD design, accessibility features

### Graphics & Rendering
- **Shader programming** - HLSL/GLSL, PBR materials, post-processing effects
- **Rendering optimization** - LOD systems, culling, batching, GPU profiling
- **Visual effects** - Particle systems, procedural generation, lighting design
- **Mobile optimization** - Texture compression, shader variants, performance profiling

### Multiplayer & Networking
- **Multiplayer architecture** - Authoritative servers, client prediction, lag compensation
- **Real-time networking** - UDP protocols, state synchronization, anti-cheat
- **Backend services** - Player authentication, matchmaking, leaderboards
- **Cloud deployment** - Dedicated servers, auto-scaling, global distribution

## Modern Game Development Implementation

### Unity 3D Game Architecture
```csharp
// Comprehensive Unity game architecture with modern patterns
using System;
using System.Collections.Generic;
using UnityEngine;
using Unity.Netcode;
using Unity.Collections;
using Cysharp.Threading.Tasks;
using System.Threading;

namespace GameArchitecture
{
    // Event System for Decoupled Communication
    public static class EventManager
    {
        private static Dictionary<Type, List<IEventListener>> listeners = new Dictionary<Type, List<IEventListener>>();

        public static void AddListener<T>(IEventListener<T> listener) where T : IGameEvent
        {
            Type eventType = typeof(T);
            if (!listeners.ContainsKey(eventType))
                listeners[eventType] = new List<IEventListener>();

            listeners[eventType].Add(listener);
        }

        public static void RemoveListener<T>(IEventListener<T> listener) where T : IGameEvent
        {
            Type eventType = typeof(T);
            if (listeners.ContainsKey(eventType))
            {
                listeners[eventType].Remove(listener);
                if (listeners[eventType].Count == 0)
                    listeners.Remove(eventType);
            }
        }

        public static void TriggerEvent<T>(T gameEvent) where T : IGameEvent
        {
            Type eventType = typeof(T);
            if (listeners.ContainsKey(eventType))
            {
                foreach (var listener in listeners[eventType])
                {
                    if (listener is IEventListener<T> typedListener)
                        typedListener.OnEventTriggered(gameEvent);
                }
            }
        }
    }

    public interface IGameEvent { }
    public interface IEventListener { }
    public interface IEventListener<T> : IEventListener where T : IGameEvent
    {
        void OnEventTriggered(T eventData);
    }

    // Game Events
    public struct PlayerSpawnedEvent : IGameEvent
    {
        public ulong PlayerId { get; }
        public Vector3 SpawnPosition { get; }

        public PlayerSpawnedEvent(ulong playerId, Vector3 spawnPosition)
        {
            PlayerId = playerId;
            SpawnPosition = spawnPosition;
        }
    }

    public struct PlayerDefeatedEvent : IGameEvent
    {
        public ulong PlayerId { get; }
        public ulong KillerId { get; }

        public PlayerDefeatedEvent(ulong playerId, ulong killerId)
        {
            PlayerId = playerId;
            KillerId = killerId;
        }
    }

    public struct InventoryChangedEvent : IGameEvent
    {
        public ulong PlayerId { get; }
        public ItemData Item { get; }
        public int Quantity { get; }

        public InventoryChangedEvent(ulong playerId, ItemData item, int quantity)
        {
            PlayerId = playerId;
            Item = item;
            Quantity = quantity;
        }
    }

    // Player Controller with Advanced Movement
    [RequireComponent(typeof(CharacterController), typeof(PlayerInput))]
    public class PlayerController : NetworkBehaviour, IEventListener<PlayerSpawnedEvent>
    {
        [Header("Movement Settings")]
        [SerializeField] private float walkSpeed = 5f;
        [SerializeField] private float runSpeed = 8f;
        [SerializeField] private float jumpHeight = 2f;
        [SerializeField] private float gravity = -9.81f;
        [SerializeField] private float groundCheckDistance = 0.1f;

        [Header("Camera Settings")]
        [SerializeField] private Transform cameraTransform;
        [SerializeField] private float mouseSensitivity = 2f;
        [SerializeField] private float maxLookAngle = 80f;

        private CharacterController characterController;
        private PlayerInput playerInput;
        private Vector3 velocity;
        private bool isGrounded;
        private bool isRunning;
        private float verticalRotation;

        // Network Variables
        private NetworkVariable<Vector3> networkPosition = new NetworkVariable<Vector3>();
        private NetworkVariable<Quaternion> networkRotation = new NetworkVariable<Quaternion>();

        private void Awake()
        {
            characterController = GetComponent<CharacterController>();
            playerInput = GetComponent<PlayerInput>();

            EventManager.AddListener<PlayerSpawnedEvent>(this);
        }

        private void OnDestroy()
        {
            EventManager.RemoveListener<PlayerSpawnedEvent>(this);
        }

        public override void OnNetworkSpawn()
        {
            if (!IsOwner)
            {
                // Disable input for non-owner clients
                playerInput.enabled = false;
                cameraTransform.gameObject.SetActive(false);
            }
            else
            {
                // Setup camera for local player
                Cursor.lockState = CursorLockMode.Locked;
                Cursor.visible = false;
            }
        }

        private void Update()
        {
            if (!IsOwner) return;

            HandleMovementInput();
            HandleCameraInput();
            ApplyGravity();
            MoveCharacter();

            // Update network position for other clients
            UpdateNetworkTransformServerRpc(transform.position, transform.rotation);
        }

        private void HandleMovementInput()
        {
            Vector2 movementInput = playerInput.actions["Move"].ReadValue<Vector2>();
            isRunning = playerInput.actions["Run"].IsPressed();
            bool jumpPressed = playerInput.actions["Jump"].WasPressedThisFrame();

            // Calculate movement
            float currentSpeed = isRunning ? runSpeed : walkSpeed;
            Vector3 movement = transform.right * movementInput.x + transform.forward * movementInput.y;
            movement = Vector3.ClampMagnitude(movement, 1f) * currentSpeed;

            // Apply movement
            characterController.Move(movement * Time.deltaTime);

            // Handle jumping
            isGrounded = Physics.CheckSphere(transform.position, groundCheckDistance, LayerMask.GetMask("Ground"));

            if (jumpPressed && isGrounded)
            {
                velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
            }
        }

        private void HandleCameraInput()
        {
            Vector2 mouseDelta = playerInput.actions["Look"].ReadValue<Vector2>() * mouseSensitivity;

            // Horizontal rotation (Y-axis)
            transform.Rotate(Vector3.up * mouseDelta.x);

            // Vertical rotation (X-axis) - clamped
            verticalRotation -= mouseDelta.y;
            verticalRotation = Mathf.Clamp(verticalRotation, -maxLookAngle, maxLookAngle);
            cameraTransform.localRotation = Quaternion.Euler(verticalRotation, 0f, 0f);
        }

        private void ApplyGravity()
        {
            if (isGrounded && velocity.y < 0)
            {
                velocity.y = -0.1f; // Small negative value to maintain ground contact
            }

            velocity.y += gravity * Time.deltaTime;
            characterController.Move(velocity * Time.deltaTime);
        }

        private void MoveCharacter()
        {
            // Additional movement logic can go here
        }

        [ServerRpc]
        private void UpdateNetworkTransformServerRpc(Vector3 position, Quaternion rotation)
        {
            networkPosition.Value = position;
            networkRotation.Value = rotation;
        }

        public void OnEventTriggered(PlayerSpawnedEvent eventData)
        {
            if (eventData.PlayerId == OwnerClientId)
            {
                transform.position = eventData.SpawnPosition;
                velocity = Vector3.zero;
            }
        }
    }

    // Inventory System
    [System.Serializable]
    public class ItemData : ScriptableObject
    {
        public string itemName;
        public string description;
        public Sprite icon;
        public int maxStackSize = 1;
        public ItemType itemType;
        public float weight;
        public int value;

        [Header("Equipment Stats")]
        public int damage;
        public int defense;
        public float durability;
    }

    public enum ItemType
    {
        Consumable,
        Equipment,
        Material,
        Quest
    }

    [System.Serializable]
    public class InventorySlot
    {
        public ItemData item;
        public int quantity;

        public InventorySlot(ItemData item, int quantity)
        {
            this.item = item;
            this.quantity = quantity;
        }

        public bool IsEmpty => item == null || quantity <= 0;
        public bool CanAddItem(ItemData newItem, int amount)
        {
            if (IsEmpty) return true;
            return item == newItem && (quantity + amount) <= item.maxStackSize;
        }
    }

    public class InventorySystem : NetworkBehaviour, IEventListener<InventoryChangedEvent>
    {
        [SerializeField] private int inventorySize = 30;
        private List<InventorySlot> slots;

        // Network synchronization
        private NetworkList<InventorySlotData> networkSlots;

        [System.Serializable]
        public struct InventorySlotData : INetworkSerializable
        {
            public int itemId;
            public int quantity;

            public void NetworkSerialize<T>(BufferSerializer<T> serializer) where T : IReaderWriter
            {
                serializer.SerializeValue(ref itemId);
                serializer.SerializeValue(ref quantity);
            }
        }

        private void Awake()
        {
            slots = new List<InventorySlot>(inventorySize);
            for (int i = 0; i < inventorySize; i++)
            {
                slots.Add(new InventorySlot(null, 0));
            }

            networkSlots = new NetworkList<InventorySlotData>();
            EventManager.AddListener<InventoryChangedEvent>(this);
        }

        private void OnDestroy()
        {
            EventManager.RemoveListener<InventoryChangedEvent>(this);
        }

        public bool AddItem(ItemData item, int quantity)
        {
            if (!IsServer) return false;

            int remainingQuantity = quantity;

            // Try to add to existing stacks first
            for (int i = 0; i < slots.Count && remainingQuantity > 0; i++)
            {
                if (slots[i].CanAddItem(item, remainingQuantity))
                {
                    if (slots[i].IsEmpty)
                    {
                        int addAmount = Mathf.Min(remainingQuantity, item.maxStackSize);
                        slots[i] = new InventorySlot(item, addAmount);
                        remainingQuantity -= addAmount;
                    }
                    else
                    {
                        int addAmount = Mathf.Min(remainingQuantity, item.maxStackSize - slots[i].quantity);
                        slots[i].quantity += addAmount;
                        remainingQuantity -= addAmount;
                    }

                    SyncSlotToNetwork(i);
                }
            }

            if (remainingQuantity == 0)
            {
                EventManager.TriggerEvent(new InventoryChangedEvent(OwnerClientId, item, quantity));
                return true;
            }

            return false; // Couldn't add all items
        }

        public bool RemoveItem(ItemData item, int quantity)
        {
            if (!IsServer) return false;

            int remainingQuantity = quantity;

            for (int i = slots.Count - 1; i >= 0 && remainingQuantity > 0; i--)
            {
                if (slots[i].item == item)
                {
                    int removeAmount = Mathf.Min(remainingQuantity, slots[i].quantity);
                    slots[i].quantity -= removeAmount;
                    remainingQuantity -= removeAmount;

                    if (slots[i].quantity <= 0)
                    {
                        slots[i] = new InventorySlot(null, 0);
                    }

                    SyncSlotToNetwork(i);
                }
            }

            if (remainingQuantity == 0)
            {
                EventManager.TriggerEvent(new InventoryChangedEvent(OwnerClientId, item, -quantity));
                return true;
            }

            return false;
        }

        private void SyncSlotToNetwork(int index)
        {
            var slotData = new InventorySlotData
            {
                itemId = slots[index].item ? GetItemId(slots[index].item) : -1,
                quantity = slots[index].quantity
            };

            if (index < networkSlots.Count)
                networkSlots[index] = slotData;
            else
                networkSlots.Add(slotData);
        }

        private int GetItemId(ItemData item)
        {
            // Implementation would map ItemData to unique IDs
            return item.GetInstanceID();
        }

        public void OnEventTriggered(InventoryChangedEvent eventData)
        {
            // Handle inventory change events
            Debug.Log($"Player {eventData.PlayerId} inventory changed: {eventData.Item.itemName} x{eventData.Quantity}");
        }
    }

    // AI Behavior System
    public abstract class AIBehaviorState : ScriptableObject
    {
        public abstract void EnterState(AIController controller);
        public abstract void UpdateState(AIController controller);
        public abstract void ExitState(AIController controller);
        public abstract bool CanTransition(AIController controller, AIBehaviorState targetState);
    }

    [CreateAssetMenu(fileName = "IdleState", menuName = "AI/Idle State")]
    public class IdleState : AIBehaviorState
    {
        [SerializeField] private float idleDuration = 2f;
        [SerializeField] private float detectionRange = 10f;

        public override void EnterState(AIController controller)
        {
            controller.Agent.isStopped = true;
            controller.Animator.SetBool("IsMoving", false);
        }

        public override void UpdateState(AIController controller)
        {
            // Check for player in range
            Collider[] playersInRange = Physics.OverlapSphere(controller.transform.position, detectionRange, LayerMask.GetMask("Player"));

            if (playersInRange.Length > 0)
            {
                controller.SetTarget(playersInRange[0].transform);
                controller.TransitionToState(controller.ChaseState);
            }
        }

        public override void ExitState(AIController controller)
        {
            // Cleanup idle state
        }

        public override bool CanTransition(AIController controller, AIBehaviorState targetState)
        {
            return true; // Idle can transition to any state
        }
    }

    [CreateAssetMenu(fileName = "ChaseState", menuName = "AI/Chase State")]
    public class ChaseState : AIBehaviorState
    {
        [SerializeField] private float chaseSpeed = 6f;
        [SerializeField] private float attackRange = 2f;
        [SerializeField] private float loseTargetTime = 5f;

        public override void EnterState(AIController controller)
        {
            controller.Agent.speed = chaseSpeed;
            controller.Agent.isStopped = false;
            controller.Animator.SetBool("IsMoving", true);
        }

        public override void UpdateState(AIController controller)
        {
            if (controller.Target == null)
            {
                controller.TransitionToState(controller.IdleState);
                return;
            }

            float distanceToTarget = Vector3.Distance(controller.transform.position, controller.Target.position);

            if (distanceToTarget <= attackRange)
            {
                controller.TransitionToState(controller.AttackState);
            }
            else if (distanceToTarget > controller.MaxChaseDistance)
            {
                controller.LoseTarget();
                controller.TransitionToState(controller.IdleState);
            }
            else
            {
                controller.Agent.SetDestination(controller.Target.position);
            }
        }

        public override void ExitState(AIController controller)
        {
            controller.Agent.isStopped = true;
        }

        public override bool CanTransition(AIController controller, AIBehaviorState targetState)
        {
            return true;
        }
    }

    [RequireComponent(typeof(UnityEngine.AI.NavMeshAgent))]
    public class AIController : NetworkBehaviour
    {
        [Header("AI States")]
        public IdleState IdleState;
        public ChaseState ChaseState;
        public AIBehaviorState AttackState;

        [Header("AI Settings")]
        public float MaxChaseDistance = 15f;
        public float Health = 100f;

        public UnityEngine.AI.NavMeshAgent Agent { get; private set; }
        public Animator Animator { get; private set; }
        public Transform Target { get; private set; }

        private AIBehaviorState currentState;
        private NetworkVariable<float> networkHealth = new NetworkVariable<float>();

        private void Awake()
        {
            Agent = GetComponent<UnityEngine.AI.NavMeshAgent>();
            Animator = GetComponent<Animator>();
        }

        public override void OnNetworkSpawn()
        {
            if (IsServer)
            {
                networkHealth.Value = Health;
                TransitionToState(IdleState);
            }
        }

        private void Update()
        {
            if (!IsServer) return;

            currentState?.UpdateState(this);
        }

        public void TransitionToState(AIBehaviorState newState)
        {
            if (newState == null || newState == currentState) return;

            if (currentState == null || currentState.CanTransition(this, newState))
            {
                currentState?.ExitState(this);
                currentState = newState;
                currentState.EnterState(this);
            }
        }

        public void SetTarget(Transform target)
        {
            Target = target;
        }

        public void LoseTarget()
        {
            Target = null;
        }

        public void TakeDamage(float damage)
        {
            if (!IsServer) return;

            Health -= damage;
            networkHealth.Value = Health;

            if (Health <= 0)
            {
                Die();
            }
        }

        private void Die()
        {
            // Handle AI death
            EventManager.TriggerEvent(new PlayerDefeatedEvent(0, Target ? Target.GetComponent<NetworkObject>().OwnerClientId : 0));
            NetworkObject.Despawn();
        }
    }

    // Performance Optimization Manager
    public class PerformanceManager : MonoBehaviour
    {
        [Header("LOD Settings")]
        [SerializeField] private int targetFrameRate = 60;
        [SerializeField] private float lodBiasAdjustment = 0.1f;

        [Header("Quality Settings")]
        [SerializeField] private bool dynamicQuality = true;
        [SerializeField] private int qualityLevelMin = 0;
        [SerializeField] private int qualityLevelMax = 5;

        private float frameTime;
        private float averageFrameTime;
        private int frameCount;

        private void Start()
        {
            Application.targetFrameRate = targetFrameRate;
            QualitySettings.vSyncCount = 0; // Disable VSync for better frame rate control
        }

        private void Update()
        {
            if (dynamicQuality)
            {
                MonitorPerformance();
                AdjustQualitySettings();
            }
        }

        private void MonitorPerformance()
        {
            frameTime = Time.unscaledDeltaTime;
            averageFrameTime = (averageFrameTime * frameCount + frameTime) / (frameCount + 1);
            frameCount++;

            if (frameCount >= 60) // Reset average every 60 frames
            {
                frameCount = 0;
            }
        }

        private void AdjustQualitySettings()
        {
            float currentFPS = 1f / averageFrameTime;
            float targetFPS = targetFrameRate;

            if (currentFPS < targetFPS * 0.9f) // Performance is below 90% of target
            {
                // Lower quality settings
                if (QualitySettings.GetQualityLevel() > qualityLevelMin)
                {
                    QualitySettings.DecreaseLevel(false);
                    Debug.Log($"Decreased quality level to {QualitySettings.GetQualityLevel()}");
                }

                // Adjust LOD bias for better performance
                QualitySettings.lodBias = Mathf.Max(0.5f, QualitySettings.lodBias - lodBiasAdjustment);
            }
            else if (currentFPS > targetFPS * 1.1f) // Performance is above 110% of target
            {
                // Increase quality settings
                if (QualitySettings.GetQualityLevel() < qualityLevelMax)
                {
                    QualitySettings.IncreaseLevel(false);
                    Debug.Log($"Increased quality level to {QualitySettings.GetQualityLevel()}");
                }

                // Adjust LOD bias for better visuals
                QualitySettings.lodBias = Mathf.Min(2f, QualitySettings.lodBias + lodBiasAdjustment);
            }
        }

        public void SetTargetFrameRate(int fps)
        {
            targetFrameRate = fps;
            Application.targetFrameRate = fps;
        }

        public float GetCurrentFPS()
        {
            return 1f / averageFrameTime;
        }

        public void ForceQualityLevel(int level)
        {
            QualitySettings.SetQualityLevel(Mathf.Clamp(level, qualityLevelMin, qualityLevelMax), false);
            dynamicQuality = false;
        }

        public void EnableDynamicQuality()
        {
            dynamicQuality = true;
        }
    }
}
```

### Multiplayer Game Server
```csharp
// Dedicated game server implementation with Unity Netcode
using Unity.Netcode;
using Unity.Netcode.Transports.UTP;
using System.Collections.Generic;
using UnityEngine;
using System.Linq;

namespace MultiplayerServer
{
    public class GameServer : NetworkBehaviour
    {
        [Header("Server Settings")]
        [SerializeField] private int maxPlayers = 32;
        [SerializeField] private float tickRate = 60f;
        [SerializeField] private bool enableAntiCheat = true;

        [Header("Game Configuration")]
        [SerializeField] private float matchDuration = 300f; // 5 minutes
        [SerializeField] private Transform[] spawnPoints;
        [SerializeField] private GameObject playerPrefab;

        private Dictionary<ulong, PlayerData> connectedPlayers = new Dictionary<ulong, PlayerData>();
        private GameState currentGameState = GameState.WaitingForPlayers;
        private float matchTimer;
        private AntiCheatSystem antiCheat;

        public enum GameState
        {
            WaitingForPlayers,
            CountingDown,
            InProgress,
            Ending
        }

        [System.Serializable]
        public class PlayerData
        {
            public ulong clientId;
            public string playerName;
            public Vector3 lastPosition;
            public float lastUpdateTime;
            public int score;
            public bool isAlive;
            public float suspiciousActivityScore;
        }

        private void Awake()
        {
            if (enableAntiCheat)
            {
                antiCheat = new AntiCheatSystem();
            }
        }

        public override void OnNetworkSpawn()
        {
            if (!IsServer) return;

            NetworkManager.Singleton.OnClientConnectedCallback += OnClientConnected;
            NetworkManager.Singleton.OnClientDisconnectCallback += OnClientDisconnected;

            // Set server tick rate
            NetworkManager.Singleton.NetworkTickSystem.TickRate = (uint)tickRate;

            Debug.Log("Game server started");
        }

        public override void OnNetworkDespawn()
        {
            if (!IsServer) return;

            NetworkManager.Singleton.OnClientConnectedCallback -= OnClientConnected;
            NetworkManager.Singleton.OnClientDisconnectCallback -= OnClientDisconnected;
        }

        private void Update()
        {
            if (!IsServer) return;

            UpdateGameState();

            if (enableAntiCheat)
            {
                antiCheat.Update();
            }
        }

        private void OnClientConnected(ulong clientId)
        {
            Debug.Log($"Client {clientId} connected");

            if (connectedPlayers.Count >= maxPlayers)
            {
                // Server full, disconnect client
                NetworkManager.Singleton.DisconnectClient(clientId);
                return;
            }

            // Create player data
            var playerData = new PlayerData
            {
                clientId = clientId,
                playerName = $"Player_{clientId}",
                isAlive = true,
                score = 0,
                suspiciousActivityScore = 0f
            };

            connectedPlayers[clientId] = playerData;

            // Spawn player
            SpawnPlayer(clientId);

            // Update game state based on player count
            UpdateGameStateBasedOnPlayerCount();
        }

        private void OnClientDisconnected(ulong clientId)
        {
            Debug.Log($"Client {clientId} disconnected");

            if (connectedPlayers.ContainsKey(clientId))
            {
                connectedPlayers.Remove(clientId);
            }

            UpdateGameStateBasedOnPlayerCount();
        }

        private void SpawnPlayer(ulong clientId)
        {
            Vector3 spawnPosition = GetSpawnPosition();

            GameObject playerObject = Instantiate(playerPrefab, spawnPosition, Quaternion.identity);
            NetworkObject networkObject = playerObject.GetComponent<NetworkObject>();

            networkObject.SpawnAsPlayerObject(clientId);

            EventManager.TriggerEvent(new PlayerSpawnedEvent(clientId, spawnPosition));
        }

        private Vector3 GetSpawnPosition()
        {
            if (spawnPoints == null || spawnPoints.Length == 0)
                return Vector3.zero;

            // Find least occupied spawn point
            Transform bestSpawn = spawnPoints[0];
            float maxDistance = 0f;

            foreach (var spawnPoint in spawnPoints)
            {
                float minDistanceToPlayers = float.MaxValue;

                foreach (var playerData in connectedPlayers.Values)
                {
                    float distance = Vector3.Distance(spawnPoint.position, playerData.lastPosition);
                    minDistanceToPlayers = Mathf.Min(minDistanceToPlayers, distance);
                }

                if (minDistanceToPlayers > maxDistance)
                {
                    maxDistance = minDistanceToPlayers;
                    bestSpawn = spawnPoint;
                }
            }

            return bestSpawn.position;
        }

        private void UpdateGameState()
        {
            switch (currentGameState)
            {
                case GameState.WaitingForPlayers:
                    // Waiting for minimum players to start
                    break;

                case GameState.CountingDown:
                    // Countdown before match starts
                    break;

                case GameState.InProgress:
                    UpdateMatchTimer();
                    break;

                case GameState.Ending:
                    HandleMatchEnd();
                    break;
            }
        }

        private void UpdateGameStateBasedOnPlayerCount()
        {
            int playerCount = connectedPlayers.Count;

            if (currentGameState == GameState.WaitingForPlayers && playerCount >= 2)
            {
                StartCountdown();
            }
            else if (currentGameState != GameState.WaitingForPlayers && playerCount < 2)
            {
                SetGameState(GameState.WaitingForPlayers);
            }
        }

        private void StartCountdown()
        {
            SetGameState(GameState.CountingDown);
            StartCountdownClientRpc();
        }

        private void UpdateMatchTimer()
        {
            matchTimer -= Time.deltaTime;

            if (matchTimer <= 0f)
            {
                EndMatch();
            }
        }

        private void EndMatch()
        {
            SetGameState(GameState.Ending);
            EndMatchClientRpc();
        }

        private void HandleMatchEnd()
        {
            // Handle post-match logic
            var winners = GetTopPlayers(3);

            // Reset for next match
            matchTimer = matchDuration;
            SetGameState(GameState.WaitingForPlayers);
        }

        private List<PlayerData> GetTopPlayers(int count)
        {
            return connectedPlayers.Values
                .OrderByDescending(p => p.score)
                .Take(count)
                .ToList();
        }

        private void SetGameState(GameState newState)
        {
            currentGameState = newState;
            UpdateGameStateClientRpc(newState);
        }

        [ClientRpc]
        private void StartCountdownClientRpc()
        {
            // Handle countdown on clients
        }

        [ClientRpc]
        private void EndMatchClientRpc()
        {
            // Handle match end on clients
        }

        [ClientRpc]
        private void UpdateGameStateClientRpc(GameState newState)
        {
            // Update game state on all clients
        }

        // Anti-cheat integration
        public void ValidatePlayerMovement(ulong clientId, Vector3 position, float timestamp)
        {
            if (!enableAntiCheat || !connectedPlayers.ContainsKey(clientId)) return;

            var playerData = connectedPlayers[clientId];

            if (antiCheat.ValidateMovement(playerData.lastPosition, position,
                                         timestamp - playerData.lastUpdateTime))
            {
                playerData.lastPosition = position;
                playerData.lastUpdateTime = timestamp;
            }
            else
            {
                // Suspicious movement detected
                playerData.suspiciousActivityScore += 1f;

                if (playerData.suspiciousActivityScore > 10f)
                {
                    // Kick player for cheating
                    NetworkManager.Singleton.DisconnectClient(clientId);
                    Debug.LogWarning($"Player {clientId} kicked for suspicious activity");
                }
            }
        }
    }

    // Anti-cheat system
    public class AntiCheatSystem
    {
        private const float MAX_MOVEMENT_SPEED = 12f; // Maximum allowed speed
        private const float TELEPORT_THRESHOLD = 50f; // Distance that indicates teleporting

        private Dictionary<ulong, List<Vector3>> playerMovementHistory = new Dictionary<ulong, List<Vector3>>();

        public bool ValidateMovement(Vector3 lastPosition, Vector3 currentPosition, float deltaTime)
        {
            if (deltaTime <= 0f) return false;

            float distance = Vector3.Distance(lastPosition, currentPosition);
            float speed = distance / deltaTime;

            // Check for impossible speeds
            if (speed > MAX_MOVEMENT_SPEED)
            {
                Debug.LogWarning($"Impossible speed detected: {speed} m/s");
                return false;
            }

            // Check for teleporting
            if (distance > TELEPORT_THRESHOLD)
            {
                Debug.LogWarning($"Potential teleport detected: {distance}m in {deltaTime}s");
                return false;
            }

            return true;
        }

        public void Update()
        {
            // Periodic anti-cheat checks
            CheckForAimbots();
            ValidatePlayerStates();
        }

        private void CheckForAimbots()
        {
            // Implementation for aimbot detection
        }

        private void ValidatePlayerStates()
        {
            // Validate player health, ammo, items, etc.
        }
    }
}
```

## Skill Activation Triggers

This skill automatically activates when:
- Game development projects are needed
- Unity or Unreal Engine development is required
- Gameplay programming is requested
- Multiplayer game systems are needed
- Game optimization and performance tuning is required
- Cross-platform game deployment is requested

This comprehensive game development skill provides expert-level capabilities for creating modern games using industry-standard engines, tools, and techniques.