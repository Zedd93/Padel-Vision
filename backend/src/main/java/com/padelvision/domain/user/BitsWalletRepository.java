package com.padelvision.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BitsWalletRepository extends JpaRepository<BitsWallet, String> {

    Optional<BitsWallet> findByUserId(String userId);
}
