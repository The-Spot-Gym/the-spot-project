import { useState, useEffect } from 'react';
import { friendshipService } from '@/services/friendshipService';
import type { Profile, Friendship } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const useFriends = () => {
  const [friends, setFriends] = useState<Profile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFriends = async () => {
    setLoading(true);
    const data = await friendshipService.getFriends();
    setFriends(data);
    setLoading(false);
  };

  const fetchPendingRequests = async () => {
    const data = await friendshipService.getPendingRequests();
    setPendingRequests(data);
  };

  const fetchSentRequests = async () => {
    const data = await friendshipService.getSentRequests();
    setSentRequests(data);
  };

  useEffect(() => {
    fetchFriends();
    fetchPendingRequests();
    fetchSentRequests();
  }, []);

  const sendRequest = async (friendId: string) => {
    const result = await friendshipService.sendRequest(friendId);
    
    if (result.success) {
      await fetchSentRequests();
      toast({
        title: "Friend request sent",
        description: "Your friend request has been sent!",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to send friend request",
        variant: "destructive",
      });
      return false;
    }
  };

  const acceptRequest = async (requestId: string) => {
    const result = await friendshipService.acceptRequest(requestId);
    
    if (result.success) {
      await fetchFriends();
      await fetchPendingRequests();
      toast({
        title: "Friend request accepted",
        description: "You are now friends!",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to accept request",
        variant: "destructive",
      });
      return false;
    }
  };

  const rejectRequest = async (requestId: string) => {
    const result = await friendshipService.rejectRequest(requestId);
    
    if (result.success) {
      await fetchPendingRequests();
      toast({
        title: "Request rejected",
        description: "Friend request rejected.",
      });
      return true;
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to reject request",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendRequest,
    acceptRequest,
    rejectRequest,
    refetch: fetchFriends,
  };
};
