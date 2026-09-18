package com.airguard.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "favorites", uniqueConstraints = {
    @UniqueConstraint(name = "uq_user_city", columnNames = {"user_identifier", "city_id"})
})
public class FavoriteCity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "city_id", nullable = false)
    private City city;

    @Column(name = "user_identifier", nullable = false, length = 100)
    private String userIdentifier;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    public FavoriteCity() {}

    public FavoriteCity(City city, String userIdentifier) {
        this.city = city;
        this.userIdentifier = userIdentifier;
        this.createdAt = OffsetDateTime.now();
    }

    @PrePersist
    public void prePersist() {
        if (this.createdAt == null) {
            this.createdAt = OffsetDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public City getCity() { return city; }
    public void setCity(City city) { this.city = city; }

    public String getUserIdentifier() { return userIdentifier; }
    public void setUserIdentifier(String userIdentifier) { this.userIdentifier = userIdentifier; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
