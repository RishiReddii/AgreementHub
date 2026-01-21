#!/usr/bin/env python3
"""
Backend API smoke tests for AgreementHub.
Runs CRUD + lifecycle checks against the live API.

Usage:
  BASE_URL=http://localhost:3001/api python scripts/backend_test.py
"""

import json
import os
import sys
from datetime import datetime

import requests

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3001/api")


class ContractManagementTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update(
            {
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        )
        self.created_blueprint_id = None
        self.created_contract_id = None
        self.test_results = {
            "blueprint_crud": {"passed": 0, "failed": 0, "errors": []},
            "contract_crud": {"passed": 0, "failed": 0, "errors": []},
            "lifecycle_transitions": {"passed": 0, "failed": 0, "errors": []},
            "stats_api": {"passed": 0, "failed": 0, "errors": []},
        }

    def log_result(self, category, test_name, success, error_msg=None):
        if success:
            self.test_results[category]["passed"] += 1
            print(f"✅ {test_name}")
        else:
            self.test_results[category]["failed"] += 1
            self.test_results[category]["errors"].append(f"{test_name}: {error_msg}")
            print(f"❌ {test_name}: {error_msg}")

    def test_blueprint_crud(self):
        print("\n=== Testing Blueprint CRUD APIs ===")
        try:
            blueprint_data = {
                "name": "Employment Contract Template",
                "description": "Standard employment contract with signature fields",
                "fields": [
                    {
                        "type": "text",
                        "label": "Employee Name",
                        "required": True,
                        "position": {"x": 0, "y": 0},
                    },
                    {
                        "type": "date",
                        "label": "Start Date",
                        "required": True,
                        "position": {"x": 0, "y": 60},
                    },
                    {
                        "type": "signature",
                        "label": "Employee Signature",
                        "required": True,
                        "position": {"x": 0, "y": 120},
                    },
                    {
                        "type": "checkbox",
                        "label": "Agrees to Terms",
                        "required": True,
                        "position": {"x": 0, "y": 180},
                    },
                ],
            }
            response = self.session.post(f"{BASE_URL}/blueprints", json=blueprint_data)
            if response.status_code == 201:
                blueprint = response.json()
                self.created_blueprint_id = blueprint["id"]
                self.log_result("blueprint_crud", "Create Blueprint", True)
            else:
                self.log_result(
                    "blueprint_crud",
                    "Create Blueprint",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                )
        except Exception as e:
            self.log_result("blueprint_crud", "Create Blueprint", False, str(e))

        try:
            response = self.session.get(f"{BASE_URL}/blueprints")
            if response.status_code == 200 and isinstance(response.json(), list):
                self.log_result("blueprint_crud", "List Blueprints", True)
            else:
                self.log_result(
                    "blueprint_crud",
                    "List Blueprints",
                    False,
                    f"Status: {response.status_code}",
                )
        except Exception as e:
            self.log_result("blueprint_crud", "List Blueprints", False, str(e))

        if self.created_blueprint_id:
            try:
                response = self.session.get(
                    f"{BASE_URL}/blueprints/{self.created_blueprint_id}"
                )
                if response.status_code == 200 and response.json().get("id") == self.created_blueprint_id:
                    self.log_result("blueprint_crud", "Get Single Blueprint", True)
                else:
                    self.log_result(
                        "blueprint_crud",
                        "Get Single Blueprint",
                        False,
                        f"Status: {response.status_code}",
                    )
            except Exception as e:
                self.log_result("blueprint_crud", "Get Single Blueprint", False, str(e))

        if self.created_blueprint_id:
            try:
                update_data = {
                    "name": "Updated Employment Contract Template",
                    "description": "Updated description",
                }
                response = self.session.put(
                    f"{BASE_URL}/blueprints/{self.created_blueprint_id}",
                    json=update_data,
                )
                if response.status_code == 200:
                    self.log_result(
                        "blueprint_crud", "Update Blueprint (no contracts)", True
                    )
                else:
                    self.log_result(
                        "blueprint_crud",
                        "Update Blueprint (no contracts)",
                        False,
                        f"Status: {response.status_code}, Response: {response.text}",
                    )
            except Exception as e:
                self.log_result(
                    "blueprint_crud", "Update Blueprint (no contracts)", False, str(e)
                )

    def test_contract_crud(self):
        print("\n=== Testing Contract CRUD APIs ===")
        if not self.created_blueprint_id:
            print("❌ Cannot test contracts without blueprint ID")
            return

        try:
            blueprint_response = self.session.get(
                f"{BASE_URL}/blueprints/{self.created_blueprint_id}"
            )
            field_values = {}
            if blueprint_response.status_code == 200:
                blueprint = blueprint_response.json()
                for field in blueprint["fields"]:
                    if field["type"] == "text":
                        field_values[field["id"]] = "John Doe"
                    elif field["type"] == "date":
                        field_values[field["id"]] = "2024-01-15"
                    elif field["type"] == "checkbox":
                        field_values[field["id"]] = True
                    elif field["type"] == "signature":
                        field_values[field["id"]] = "John Doe Signature"

            contract_data = {
                "name": "John Doe Employment Contract",
                "blueprintId": self.created_blueprint_id,
                "fieldValues": field_values,
            }
            response = self.session.post(f"{BASE_URL}/contracts", json=contract_data)
            if response.status_code == 201:
                contract = response.json()
                self.created_contract_id = contract["id"]
                self.log_result("contract_crud", "Create Contract", True)
            else:
                self.log_result(
                    "contract_crud",
                    "Create Contract",
                    False,
                    f"Status: {response.status_code}, Response: {response.text}",
                )
        except Exception as e:
            self.log_result("contract_crud", "Create Contract", False, str(e))

        try:
            response = self.session.get(f"{BASE_URL}/contracts")
            if response.status_code == 200 and isinstance(response.json(), list):
                self.log_result("contract_crud", "List Contracts", True)
            else:
                self.log_result(
                    "contract_crud",
                    "List Contracts",
                    False,
                    f"Status: {response.status_code}",
                )
        except Exception as e:
            self.log_result("contract_crud", "List Contracts", False, str(e))

        try:
            response = self.session.get(f"{BASE_URL}/contracts?status=created")
            if response.status_code == 200:
                self.log_result(
                    "contract_crud", "List Contracts (status filter)", True
                )
            else:
                self.log_result(
                    "contract_crud",
                    "List Contracts (status filter)",
                    False,
                    f"Status: {response.status_code}",
                )

            response = self.session.get(f"{BASE_URL}/contracts?category=pending")
            if response.status_code == 200:
                self.log_result(
                    "contract_crud", "List Contracts (category filter)", True
                )
            else:
                self.log_result(
                    "contract_crud",
                    "List Contracts (category filter)",
                    False,
                    f"Status: {response.status_code}",
                )
        except Exception as e:
            self.log_result(
                "contract_crud", "List Contracts (filters)", False, str(e)
            )

        if self.created_contract_id:
            try:
                response = self.session.get(
                    f"{BASE_URL}/contracts/{self.created_contract_id}"
                )
                if response.status_code == 200 and response.json().get("id") == self.created_contract_id:
                    self.log_result("contract_crud", "Get Single Contract", True)
                else:
                    self.log_result(
                        "contract_crud",
                        "Get Single Contract",
                        False,
                        f"Status: {response.status_code}",
                    )
            except Exception as e:
                self.log_result("contract_crud", "Get Single Contract", False, str(e))

        if self.created_contract_id:
            try:
                contract_response = self.session.get(
                    f"{BASE_URL}/contracts/{self.created_contract_id}"
                )
                if contract_response.status_code == 200:
                    contract = contract_response.json()
                    field_values = {}
                    for field in contract["fields"]:
                        if field["type"] == "text":
                            field_values[field["id"]] = "Jane Doe Updated"

                    update_data = {"fieldValues": field_values}
                    response = self.session.put(
                        f"{BASE_URL}/contracts/{self.created_contract_id}",
                        json=update_data,
                    )
                    if response.status_code == 200:
                        self.log_result(
                            "contract_crud", "Update Contract Fields", True
                        )
                    else:
                        self.log_result(
                            "contract_crud",
                            "Update Contract Fields",
                            False,
                            f"Status: {response.status_code}, Response: {response.text}",
                        )
                else:
                    self.log_result(
                        "contract_crud",
                        "Update Contract Fields",
                        False,
                        "Could not get contract for update",
                    )
            except Exception as e:
                self.log_result("contract_crud", "Update Contract Fields", False, str(e))

    def test_lifecycle_transitions(self):
        print("\n=== Testing Contract Lifecycle Transitions ===")
        if not self.created_contract_id:
            print("❌ Cannot test transitions without contract ID")
            return

        valid_transitions = [
            ("created", "approved", "Contract approved for sending"),
            ("approved", "sent", "Contract sent to client"),
            ("sent", "signed", "Contract signed by client"),
            ("signed", "locked", "Contract locked and finalized"),
        ]

        current_status = "created"
        for from_status, to_status, note in valid_transitions:
            try:
                transition_data = {"newStatus": to_status, "note": note}
                response = self.session.post(
                    f"{BASE_URL}/contracts/{self.created_contract_id}/transition",
                    json=transition_data,
                )
                if response.status_code == 200 and response.json().get("status") == to_status:
                    self.log_result(
                        "lifecycle_transitions",
                        f"Transition {from_status} → {to_status}",
                        True,
                    )
                    current_status = to_status
                else:
                    self.log_result(
                        "lifecycle_transitions",
                        f"Transition {from_status} → {to_status}",
                        False,
                        f"Status: {response.status_code}, Response: {response.text}",
                    )
            except Exception as e:
                self.log_result(
                    "lifecycle_transitions",
                    f"Transition {from_status} → {to_status}",
                    False,
                    str(e),
                )

        try:
            contract_data = {
                "name": "Contract for Invalid Transitions",
                "blueprintId": self.created_blueprint_id,
            }
            response = self.session.post(f"{BASE_URL}/contracts", json=contract_data)
            if response.status_code == 201:
                test_contract_id = response.json()["id"]
                invalid_transitions = [
                    ("created", "sent"),
                    ("created", "signed"),
                    ("created", "locked"),
                ]
                for from_status, to_status in invalid_transitions:
                    transition_data = {"newStatus": to_status, "note": "Should fail"}
                    response = self.session.post(
                        f"{BASE_URL}/contracts/{test_contract_id}/transition",
                        json=transition_data,
                    )
                    if response.status_code == 400:
                        self.log_result(
                            "lifecycle_transitions",
                            f"Invalid Transition {from_status} → {to_status} (expected fail)",
                            True,
                        )
                    else:
                        self.log_result(
                            "lifecycle_transitions",
                            f"Invalid Transition {from_status} → {to_status} (expected fail)",
                            False,
                            f"Expected 400, got {response.status_code}",
                        )
        except Exception as e:
            self.log_result(
                "lifecycle_transitions", "Setup for Invalid Transitions", False, str(e)
            )

        if current_status == "locked":
            try:
                update_data = {"name": "Should not be allowed"}
                response = self.session.put(
                    f"{BASE_URL}/contracts/{self.created_contract_id}",
                    json=update_data,
                )
                if response.status_code == 400:
                    self.log_result(
                        "lifecycle_transitions", "Locked Contract Immutability", True
                    )
                else:
                    self.log_result(
                        "lifecycle_transitions",
                        "Locked Contract Immutability",
                        False,
                        f"Expected 400, got {response.status_code}",
                    )
            except Exception as e:
                self.log_result(
                    "lifecycle_transitions",
                    "Locked Contract Immutability",
                    False,
                    str(e),
                )

    def test_blueprint_protection(self):
        print("\n=== Testing Blueprint Protection ===")
        if not self.created_blueprint_id:
            print("❌ Cannot test blueprint protection without blueprint ID")
            return

        try:
            update_data = {
                "name": "Should not be allowed to update",
                "description": "This should fail",
            }
            response = self.session.put(
                f"{BASE_URL}/blueprints/{self.created_blueprint_id}",
                json=update_data,
            )
            if response.status_code == 400:
                self.log_result(
                    "blueprint_crud",
                    "Update Blueprint (with contracts - should fail)",
                    True,
                )
            else:
                self.log_result(
                    "blueprint_crud",
                    "Update Blueprint (with contracts - should fail)",
                    False,
                    f"Expected 400, got {response.status_code}",
                )
        except Exception as e:
            self.log_result(
                "blueprint_crud",
                "Update Blueprint (with contracts - should fail)",
                False,
                str(e),
            )

        try:
            response = self.session.delete(
                f"{BASE_URL}/blueprints/{self.created_blueprint_id}"
            )
            if response.status_code == 400:
                self.log_result(
                    "blueprint_crud",
                    "Delete Blueprint (with contracts - should fail)",
                    True,
                )
            else:
                self.log_result(
                    "blueprint_crud",
                    "Delete Blueprint (with contracts - should fail)",
                    False,
                    f"Expected 400, got {response.status_code}",
                )
        except Exception as e:
            self.log_result(
                "blueprint_crud",
                "Delete Blueprint (with contracts - should fail)",
                False,
                str(e),
            )

    def test_stats_api(self):
        print("\n=== Testing Stats API ===")
        try:
            response = self.session.get(f"{BASE_URL}/stats")
            if response.status_code == 200:
                stats = response.json()
                required = ["totalContracts", "totalBlueprints", "byStatus", "byCategory"]
                if all(k in stats for k in required):
                    self.log_result("stats_api", "Get Dashboard Stats", True)
                else:
                    missing = [k for k in required if k not in stats]
                    self.log_result(
                        "stats_api",
                        "Get Dashboard Stats",
                        False,
                        f"Missing fields: {missing}",
                    )
            else:
                self.log_result(
                    "stats_api",
                    "Get Dashboard Stats",
                    False,
                    f"Status: {response.status_code}",
                )
        except Exception as e:
            self.log_result("stats_api", "Get Dashboard Stats", False, str(e))

    def test_contract_deletion(self):
        print("\n=== Testing Contract Deletion ===")
        if not self.created_blueprint_id:
            return

        try:
            contract_data = {
                "name": "Contract for Deletion Test",
                "blueprintId": self.created_blueprint_id,
            }
            response = self.session.post(f"{BASE_URL}/contracts", json=contract_data)
            if response.status_code == 201:
                delete_contract_id = response.json()["id"]
                response = self.session.delete(
                    f"{BASE_URL}/contracts/{delete_contract_id}"
                )
                if response.status_code == 200:
                    self.log_result(
                        "contract_crud", "Delete Contract (created status)", True
                    )
                else:
                    self.log_result(
                        "contract_crud",
                        "Delete Contract (created status)",
                        False,
                        f"Status: {response.status_code}",
                    )
        except Exception as e:
            self.log_result(
                "contract_crud", "Delete Contract (created status)", False, str(e)
            )

        if self.created_contract_id:
            try:
                response = self.session.delete(
                    f"{BASE_URL}/contracts/{self.created_contract_id}"
                )
                if response.status_code == 400:
                    self.log_result(
                        "contract_crud",
                        "Delete Contract (non-created status - should fail)",
                        True,
                    )
                else:
                    self.log_result(
                        "contract_crud",
                        "Delete Contract (non-created status - should fail)",
                        False,
                        f"Expected 400, got {response.status_code}",
                    )
            except Exception as e:
                self.log_result(
                    "contract_crud",
                    "Delete Contract (non-created status - should fail)",
                    False,
                    str(e),
                )

    def run_all_tests(self):
        print("🚀 Starting AgreementHub backend API tests")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"⏰ Test started at: {datetime.now().isoformat()}")

        self.test_blueprint_crud()
        self.test_contract_crud()
        self.test_lifecycle_transitions()
        self.test_blueprint_protection()
        self.test_contract_deletion()
        self.test_stats_api()
        self.print_summary()

    def print_summary(self):
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)

        total_passed = 0
        total_failed = 0
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            total_passed += passed
            total_failed += failed
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{category.upper().replace('_', ' ')}: {status} ({passed} passed, {failed} failed)")
            for error in results["errors"]:
                print(f"  ❌ {error}")

        overall_status = (
            "✅ ALL TESTS PASSED" if total_failed == 0 else f"❌ {total_failed} TESTS FAILED"
        )
        print("-" * 60)
        print(f"OVERALL: {overall_status} ({total_passed} passed, {total_failed} failed)")
        print("=" * 60)
        return total_failed == 0


if __name__ == "__main__":
    tester = ContractManagementTester()
    ok = tester.run_all_tests()
    sys.exit(0 if ok else 1)

