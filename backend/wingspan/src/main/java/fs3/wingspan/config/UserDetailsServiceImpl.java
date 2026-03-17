package fs3.wingspan.config;


import fs3.wingspan.model.Users;
import fs3.wingspan.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService{
    @Autowired
    private UserRepository userRepository;

    /**
     * loads user by username for Spring Security session validation & checks email on fallback
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Users u = userRepository.findByUsername(username);

        if (u == null) {
            u = userRepository.findByEmail(username);
        }

        if (u == null) {
            throw new UsernameNotFoundException("User not found: " + username);
        }

        return u;
    }
}
