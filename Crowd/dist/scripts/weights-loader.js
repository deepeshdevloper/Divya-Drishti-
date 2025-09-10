/**
 * YOLOv8 Simhastha Weights Loader
 * Browser-compatible loader for the generated weights file
 */

class YOLOv8SimhasthaWeightsLoader {
    constructor() {
        this.weightsCache = new Map();
        this.metadata = null;
        this.weightIndex = null;
        this.isLoaded = false;
    }

    async loadWeights(weightsUrl = '/models/yolo8-simhastha-weights.bin') {
        console.log('🔄 Loading YOLOv8 Simhastha weights...');

        try {
            // Load metadata first
            const metadataUrl = weightsUrl.replace('.bin', '.json');
            const metadataResponse = await fetch(metadataUrl);

            if (!metadataResponse.ok) {
                throw new Error(`Failed to load metadata: ${metadataResponse.status}`);
            }

            this.metadata = await metadataResponse.json();
            this.weightIndex = this.metadata.weight_index;

            console.log(`📊 Model: ${this.metadata.model_name} v${this.metadata.version}`);
            console.log(`🎯 Specialization: ${this.metadata.specialization}`);

            // Load binary weights
            const weightsResponse = await fetch(weightsUrl);

            if (!weightsResponse.ok) {
                throw new Error(`Failed to load weights: ${weightsResponse.status}`);
            }

            const buffer = await weightsResponse.arrayBuffer();
            console.log(`💾 Loaded weights: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);

            // Parse weights file
            const view = new DataView(buffer);
            const metadataLength = view.getUint32(0, true);
            const totalFloats = view.getUint32(4, true);
            const numLayers = view.getUint32(8, true);

            // Extract weights data
            const floatView = new Float32Array(buffer, 1024, totalFloats);

            // Cache weights by layer name
            this.weightIndex.forEach(layer => {
                const weights = floatView.slice(layer.offset, layer.offset + layer.length);
                this.weightsCache.set(layer.name, {
                    weights: weights,
                    shape: layer.shape,
                    length: layer.length
                });
            });

            this.isLoaded = true;
            console.log(`✅ Successfully loaded ${numLayers} layers with ${totalFloats.toLocaleString()} parameters`);

            return {
                success: true,
                metadata: this.metadata,
                layerCount: numLayers,
                parameterCount: totalFloats
            };

        } catch (error) {
            console.error('❌ Failed to load YOLOv8 Simhastha weights:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    getLayerWeights(layerName) {
        if (!this.isLoaded) {
            throw new Error('Weights not loaded. Call loadWeights() first.');
        }

        const layer = this.weightsCache.get(layerName);
        if (!layer) {
            throw new Error(`Layer not found: ${layerName}`);
        }

        return layer;
    }

    getAllLayerNames() {
        if (!this.isLoaded) {
            return [];
        }

        return Array.from(this.weightsCache.keys());
    }

    getModelMetadata() {
        return this.metadata;
    }

    getSimhasthaCapabilities() {
        if (!this.metadata) {
            return [];
        }

        return this.metadata.capabilities || [];
    }

    getPerformanceMetrics() {
        if (!this.metadata) {
            return null;
        }

        return this.metadata.performance;
    }

    validateWeightsIntegrity() {
        if (!this.isLoaded) {
            return false;
        }

        let validLayers = 0;
        let totalWeights = 0;

        this.weightsCache.forEach((layer, name) => {
            // Check for NaN or infinite values
            const hasInvalidValues = Array.from(layer.weights).some(w =>
                isNaN(w) || !isFinite(w)
            );

            if (!hasInvalidValues) {
                validLayers++;
            } else {
                console.warn(`⚠️  Invalid values in layer: ${name}`);
            }

            totalWeights += layer.weights.length;
        });

        console.log(`🔍 Validation results:`);
        console.log(`   - Valid layers: ${validLayers}/${this.weightsCache.size}`);
        console.log(`   - Total weights: ${totalWeights.toLocaleString()}`);

        return validLayers === this.weightsCache.size;
    }

    // Convert weights to TensorFlow.js format
    convertToTensorFlowJS() {
        if (!this.isLoaded) {
            throw new Error('Weights not loaded');
        }

        const tfWeights = {};

        this.weightsCache.forEach((layer, name) => {
            // Convert Float32Array to regular array for JSON serialization
            tfWeights[name] = {
                data: Array.from(layer.weights),
                shape: layer.shape,
                dtype: 'float32'
            };
        });

        return {
            modelTopology: this.generateTensorFlowJSTopology(),
            weightsManifest: [{
                paths: ['weights.bin'],
                weights: Object.keys(tfWeights).map(name => ({
                    name: name,
                    shape: tfWeights[name].shape,
                    dtype: tfWeights[name].dtype
                }))
            }],
            weights: tfWeights,
            metadata: this.metadata
        };
    }

    generateTensorFlowJSTopology() {
        return {
            class_name: 'Model',
            config: {
                name: this.metadata.model_name,
                layers: [
                    {
                        class_name: 'InputLayer',
                        config: {
                            name: 'input',
                            dtype: 'float32',
                            batch_input_shape: [null, ...this.metadata.input_size]
                        }
                    },
                    // Add more layers based on architecture
                    // This would be expanded based on the full model structure
                ]
            },
            keras_version: '2.12.0',
            backend: 'tensorflow'
        };
    }

    // Export weights for ONNX format
    exportToONNX() {
        if (!this.isLoaded) {
            throw new Error('Weights not loaded');
        }

        // This would generate ONNX-compatible weight format
        // For now, return the structure that would be used
        return {
            format: 'ONNX',
            version: '1.12.0',
            producer: 'YOLOv8-Simhastha-Generator',
            model_version: this.metadata.version,
            graph: {
                node: [], // Would contain ONNX nodes
                initializer: [], // Would contain weight tensors
                input: [{
                    name: 'images',
                    type: {
                        tensor_type: {
                            elem_type: 1, // FLOAT
                            shape: {
                                dim: [
                                    { dim_value: 1 }, // batch
                                    { dim_value: 3 }, // channels
                                    { dim_value: 640 }, // height
                                    { dim_value: 640 }  // width
                                ]
                            }
                        }
                    }
                }],
                output: [{
                    name: 'output',
                    type: {
                        tensor_type: {
                            elem_type: 1, // FLOAT
                            shape: {
                                dim: [
                                    { dim_value: 1 }, // batch
                                    { dim_value: 25200 }, // detections
                                    { dim_value: 6 } // [x, y, w, h, conf, class]
                                ]
                            }
                        }
                    }
                }]
            }
        };
    }

    // Memory cleanup
    dispose() {
        this.weightsCache.clear();
        this.metadata = null;
        this.weightIndex = null;
        this.isLoaded = false;
        console.log('🧹 Weights cache cleared');
    }
}

// Browser compatibility
if (typeof window !== 'undefined') {
    window.YOLOv8SimhasthaWeightsLoader = YOLOv8SimhasthaWeightsLoader;
}

// Node.js compatibility
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { YOLOv8SimhasthaWeightsLoader };
}