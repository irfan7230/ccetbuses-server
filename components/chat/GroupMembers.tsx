import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Avatar } from 'react-native-paper';

export const GroupMembers = () => {
  const members = [
    { id: '1', avatar: require('../../assets/images/avatar.png') },
    { id: '2', avatar: require('../../assets/images/avatar.png') },
  ];

  return (
    <TouchableOpacity style={styles.groupMembersContainer}>
      {members.map((member, index) => (
        <Avatar.Image
          key={member.id}
          size={32}
          source={member.avatar}
          style={[
            styles.memberAvatar,
            { 
              marginLeft: index > 0 ? -12 : 0, // Adjusted overlap
              zIndex: members.length - index,
            }
          ]}
        />
      ))}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  groupMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  memberAvatar: {
    borderWidth: 2,
    borderColor: '#1A1A1D', // Match screen background color
  },
});