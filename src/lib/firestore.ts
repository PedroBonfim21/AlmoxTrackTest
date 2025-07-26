
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, writeBatch, runTransaction, getDoc, increment } from 'firebase/firestore';

// Product Type
export type Product = {
    id: string;
    image?: string;
    name: string;
    code: string;
    patrimony: string;
    type: 'consumo' | 'permanente';
    quantity: number;
    unit: string;
    category: string;
};

// Movement Type
export type Movement = {
    id: string;
    productId: string;
    date: string; // ISO 8601 format
    type: 'Entrada' | 'Saída' | 'Devolução';
    quantity: number;
    responsible: string;
    department?: string;
};


// Product Functions
const productsCollection = collection(db, 'products');

export const getProducts = async (): Promise<Product[]> => {
    const snapshot = await getDocs(productsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
};

export const addProduct = async (productData: Omit<Product, 'id'>): Promise<string> => {
    const docRef = await addDoc(productsCollection, productData);
    return docRef.id;
};

export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, productData);
};

export const updateProductQuantityOnEntry = async (productId: string, quantity: number): Promise<void> => {
    const productRef = doc(db, "products", productId);
    try {
        await runTransaction(db, async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw "Document does not exist!";
            }
            
            const newQuantity = (productDoc.data().quantity || 0) + quantity;
            transaction.update(productRef, { quantity: newQuantity });

            const movementData: Omit<Movement, 'id'> = {
                productId: productId,
                date: new Date().toISOString(),
                type: 'Entrada',
                quantity: quantity,
                responsible: 'Sistema'
            };
            const movementRef = doc(collection(db, "movements"));
            transaction.set(movementRef, movementData);
        });
    } catch (e) {
        console.error("Transaction failed: ", e);
    }
}


export const deleteProduct = async (productId: string): Promise<void> => {
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};

// Movement Functions
const movementsCollection = collection(db, 'movements');

export const getMovements = async (): Promise<Movement[]> => {
    const snapshot = await getDocs(movementsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
};

export const getMovementsForItem = async (productId: string): Promise<Movement[]> => {
    const q = query(movementsCollection, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
}

export const addMovement = async (movementData: Omit<Movement, 'id'>): Promise<string> => {
    const docRef = await addDoc(movementsCollection, movementData);
    return docRef.id;
};

// This function is useful for initializing the database with some data.
export const seedDatabase = async (products: Omit<Product, 'id'>[], movements: Omit<Movement, 'id'>[]) => {
    const batch = writeBatch(db);

    products.forEach(product => {
        const docRef = doc(collection(db, 'products'));
        batch.set(docRef, product);
    });

    movements.forEach(movement => {
        const docRef = doc(collection(db, 'movements'));
        batch.set(docRef, movement);
    });

    await batch.commit();
    console.log('Database seeded successfully!');
}
