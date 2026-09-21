import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

import tensorflow as tf
tf.config.threading.set_inter_op_parallelism_threads(1)
tf.config.threading.set_intra_op_parallelism_threads(1)
from tensorflow.keras import layers, models, callbacks

def build_and_train_mlp(X_train, y_train, X_test, y_test, num_classes: int, save_path: str):
    """
    Builds and trains a Keras Multi-Layer Perceptron (MLP).
    Uses Early Stopping to prevent overfitting.
    """
    input_dim = X_train.shape[1]
    
    # 1. Architecture
    model = models.Sequential([
        layers.Dense(128, activation='relu', input_shape=(input_dim,)),
        layers.Dropout(0.3),
        layers.Dense(64, activation='relu'),
        # Output layer adjusts automatically based on binary vs multi-class
        layers.Dense(1 if num_classes == 2 else num_classes, 
                     activation='sigmoid' if num_classes == 2 else 'softmax')
    ])
    
    # 2. Compilation
    loss_fn = 'binary_crossentropy' if num_classes == 2 else 'sparse_categorical_crossentropy'
    model.compile(
        optimizer='adam',
        loss=loss_fn,
        metrics=['accuracy']
    )
    
    # 3. Callbacks (Early Stopping)
    early_stop = callbacks.EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True
    )
    
    # 4. Training
    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=100, # High limit, relying on early stopping
        batch_size=32,
        callbacks=[early_stop],
        verbose=0 # Silent execution for background worker
    )
    
    # 5. Export .h5 weights
    model.save(save_path, save_format='h5')
    
    # 6. Format Training Curve for UI Plotting
    training_curve = []
    epochs_trained = len(history.history['loss'])
    for i in range(epochs_trained):
        training_curve.append({
            "epoch": i + 1,
            "loss": float(history.history['loss'][i]),
            "val_loss": float(history.history['val_loss'][i]),
            "accuracy": float(history.history['accuracy'][i]),
            "val_accuracy": float(history.history['val_accuracy'][i])
        })
        
    return {
        "model_path": save_path,
        "epochs_trained": epochs_trained,
        "training_curve": training_curve
    }
