package com.pricing.catalog.controller;

import com.pricing.catalog.dto.CreateProductRequest;
import com.pricing.catalog.dto.UpdateProductRequest;
import com.pricing.catalog.model.PriceAuditLog;
import com.pricing.catalog.model.Product;
import com.pricing.catalog.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    @GetMapping
    public List<Product> getProducts(@RequestParam(required = false) String category) {
        return productService.getProducts(category);
    }

    @GetMapping("/{productId}")
    public Product getProduct(@PathVariable String productId) {
        return productService.getProductById(productId);
    }

    @PutMapping("/{productId}")
    public Product updateProduct(@PathVariable String productId,
                                 @Valid @RequestBody UpdateProductRequest request) {
        return productService.updateProduct(productId, request);
    }

    @DeleteMapping("/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable String productId) {
        productService.deleteProduct(productId);
    }

    @GetMapping("/{productId}/audit")
    public List<PriceAuditLog> getAuditLog(@PathVariable String productId) {
        return productService.getAuditLog(productId);
    }
}
