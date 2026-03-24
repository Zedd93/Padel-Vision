package com.padelvision.shared;

import com.padelvision.shared.dto.ContactRequest;
import com.padelvision.shared.response.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Contact form endpoint")
public class ContactController {

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> submitContact(@Valid @RequestBody ContactRequest request) {
        log.info("Contact form submitted: name={}, email={}", request.getName(), request.getEmail());
        // TODO: Send email notification or persist contact message
        return ResponseEntity.ok(ApiResponse.ok(null, "Message sent successfully"));
    }
}
