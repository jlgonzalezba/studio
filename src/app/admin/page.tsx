"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface PendingUser {
  id: string;
  email: string;
  status: string;
  emailVerified: boolean;
  createdAt: Date;
}

export default function AdminPanel() {
  const [allUsers, setAllUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user && user.email === "admin@enertech3.com") {
      fetchAllUsers();
    }
  }, [user]);

  const fetchAllUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "pending_users"));
      const users = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as PendingUser[];
      setAllUsers(users);
    } catch (error) {
      toast({
        title: "Error",
        description: "Error loading users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: "approved" | "rejected") => {
    try {
      // Get user data first
      const userDoc = await getDoc(doc(db, "pending_users", userId));
      const userData = userDoc.data();

      // Update status
      await updateDoc(doc(db, "pending_users", userId), { status });

      // Send approval email if approved
      if (status === "approved" && userData?.email) {
        try {
          await fetch('/api/send-approval-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: userData.email }),
          });
        } catch (emailError) {
          console.error('Error sending approval email:', emailError);
          // Don't fail the approval if email fails
        }
      }

      toast({
        title: "Updated",
        description: `User ${status === "approved" ? "approved" : "rejected"}.`,
      });
      fetchAllUsers(); // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: "Error updating user",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user || user.email !== "admin@enertech3.com") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
          <p>Debes estar autenticado como administrador para acceder a esta página.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  const pendingUsers = allUsers.filter(user => user.status === "pending");
  const approvedUsers = allUsers.filter(user => user.status === "approved");
  const rejectedUsers = allUsers.filter(user => user.status === "rejected");

  const UserList = ({ users, showActions = false }: { users: PendingUser[], showActions?: boolean }) => (
    <div className="space-y-4">
      {users.length === 0 ? (
        <p>No users in this category.</p>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <p className="font-medium">{user.email}</p>
              <p className="text-sm text-muted-foreground">
                Registered on {user.createdAt.toLocaleDateString()}
              </p>
              <p className="text-sm">
                Email verified: {user.emailVerified ? "Yes" : "No"}
              </p>
            </div>
            {showActions && (
              <div className="space-x-2">
                <Button
                  onClick={() => updateUserStatus(user.id, "approved")}
                  variant="default"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => updateUserStatus(user.id, "rejected")}
                  variant="destructive"
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>
            Manage all user accounts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pending Users ({pendingUsers.length})</h3>
              <UserList users={pendingUsers} showActions={true} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Approved Users ({approvedUsers.length})</h3>
              <UserList users={approvedUsers} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Rejected Users ({rejectedUsers.length})</h3>
              <UserList users={rejectedUsers} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}