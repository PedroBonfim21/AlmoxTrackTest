
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
    supplier?: string;
    invoice?: string;
};

type EntryData = {
    items: { id: string; quantity: number }[];
    date: string;
    supplier: string;
    invoice: string;
    responsible: string;
}


// Product Functions
const productsCollection = collection(db, 'products');
const movementsCollection = collection(db, 'movements');

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
    const productDoc = doc(db, 'products', productId);
    await updateDoc(productDoc, {
        quantity: increment(quantity)
    });
};


export const finalizeEntry = async (entryData: EntryData): Promise<void> => {
    try {
        await runTransaction(db, async (transaction) => {
            for (const item of entryData.items) {
                const productRef = doc(db, "products", item.id);
                const productDoc = await transaction.get(productRef);

                if (!productDoc.exists()) {
                    throw new Error(`Product with ID ${item.id} does not exist!`);
                }

                // Increment product quantity
                transaction.update(productRef, { quantity: increment(item.quantity) });

                // Create movement record
                const movementData: Omit<Movement, 'id'> = {
                    productId: item.id,
                    date: entryData.date,
                    type: 'Entrada',
                    quantity: item.quantity,
                    responsible: entryData.responsible,
                    supplier: entryData.supplier,
                    invoice: entryData.invoice,
                };
                const movementRef = doc(collection(db, "movements"));
                transaction.set(movementRef, movementData);
            }
        });
        console.log("Transaction successfully committed!");
    } catch (e) {
        console.error("Transaction failed: ", e);
        throw e; // Re-throw the error to be caught by the calling function
    }
};


export const deleteProduct = async (productId: string): Promise<void> => {
    // Also delete associated movements in a transaction? For now, just delete the product.
    const productDoc = doc(db, 'products', productId);
    await deleteDoc(productDoc);
};

// Movement Functions

export const getMovements = async (): Promise<Movement[]> => {
    const snapshot = await getDocs(movementsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
};

export const getMovementsForItem = async (productId: string): Promise<Movement[]> => {
    const q = query(movementsCollection, where('productId', '==', productId));
    const snapshot = await getDocs(q);
    const movements = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Movement));
    // Sort by date descending
    return movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
